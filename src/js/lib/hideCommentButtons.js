/* eslint-disable rulesdir/prefer-underscore-method */
import $ from 'jquery';
import * as API from './api';

const ACTIONS = [
    {classifier: 'OFF_TOPIC', label: 'Off-topic'},
    {classifier: 'OUTDATED', label: 'Outdated'},
    {classifier: 'RESOLVED', label: 'Resolved'},
];

const BUTTONS_CLASS = 'k2-hide-comment-buttons';

// Author profile links rendered in a comment's header. Regular users get a user
// hovercard, which is the most stable signal across the legacy and React UIs.
// GitHub App bots (for example the Codex reviewer) render their author link with
// no hovercard at all, just an `/apps/<name>` href, so match that too. Without
// it the bot's review comments never get the buttons.
const AUTHOR_SELECTOR = [
    'a[data-hovercard-url*="/users/"]',
    'a[data-hovercard-type="user"]',
    'a[href*="/apps/"]',
].join(', ');
const COMMENT_BODY_SELECTOR = '.markdown-body, .comment-body, [data-testid="markdown-body"], [data-testid="issue-comment-body"]';

// Comment-like things on issue/PR pages whose permalinks live next to their
// header. Each entry maps a regex over the permalink href to the comment type
// we send to the right REST endpoint when looking up the GraphQL node id.
// Order matters: `pullrequestreviewcomment-` must come before `pullrequestreview-`
// because the former's href contains the latter as a substring.
const PERMALINK_TYPES = [
    {type: 'pullrequestreviewcomment', pattern: /pullrequestreviewcomment-(\d+)/},
    {type: 'pullrequestreviewcomment', pattern: /discussion_r(\d+)/},
    {type: 'pullrequestreview', pattern: /pullrequestreview-(\d+)/},
    {type: 'issuecomment', pattern: /issuecomment-(\d+)/},
];
const PERMALINK_SELECTOR = [
    'a[href*="#issuecomment-"]',
    'a[href*="#pullrequestreview-"]',
    'a[href*="#pullrequestreviewcomment-"]',
    'a[href*="#discussion_r"]',
].join(', ');

let observer = null;
let scanScheduled = false;

function isOptionsButton(btn) {
    const label = (btn.getAttribute('aria-label') || '').toLowerCase();
    if (label.includes('options') || label.includes('show menu') || label === 'more') {
        return true;
    }

    // The "..." trigger is rendered as a kebab icon in both legacy and React UIs.
    return !!btn.querySelector('.octicon-kebab-horizontal, [class*="KebabHorizontal"]');
}

// The kebab trigger is a <button> in the React UI but a <summary> in the legacy
// details-menu that PR review comments still use, so look at both. isOptionsButton
// keeps this from matching anything except the kebab itself.
function findOptionsButton(rootEl) {
    return $(rootEl).find('button, summary').filter((i, btn) => isOptionsButton(btn)).first();
}

// Exclude `@username` mentions inside a comment body — those also point at user
// profiles but aren't the comment's author.
function isHeaderAuthorLink(link) {
    const text = (link.textContent || '').trim();
    if (text.startsWith('@')) {
        return false;
    }
    if (link.classList.contains('user-mention')) {
        return false;
    }
    if (link.closest('.markdown-body, .comment-body, [data-testid="markdown-body"]')) {
        return false;
    }
    return true;
}

function parsePermalink(permalink) {
    const href = permalink.getAttribute('href') || '';
    for (let i = 0; i < PERMALINK_TYPES.length; i++) {
        const {type, pattern} = PERMALINK_TYPES[i];
        const match = href.match(pattern);
        if (match) {
            return {type, id: match[1]};
        }
    }
    return null;
}

function getPermalinkHash(permalink) {
    const href = permalink.getAttribute('href') || '';
    const hashIdx = href.indexOf('#');
    return hashIdx >= 0 ? href.slice(hashIdx + 1) : '';
}

// Walk up from an author link to the smallest ancestor that scopes the comment.
// We accept the ancestor when it contains a permalink AND either:
//   - its `id` matches the permalink's target hash (e.g. an `<a href="#pullrequestreview-X">`
//     paired with an `<div id="pullrequestreview-X">`), or
//   - it contains a recognizable comment body (`.markdown-body` etc.)
// The id-match path catches cases where the body class isn't in our selector
// list (PR reviews wrap their content in a `task-lists`/`comment-body` table
// that varies across layouts). Requiring one of the two keeps us out of bare
// timeline event entries — which share the permalink href but have no
// matching id and no body — and the assignee sidebar.
function findCommentHeader(authorLink) {
    let el = authorLink.parentElement;
    while (el && el !== document.body) {
        const permalink = el.querySelector(PERMALINK_SELECTOR);
        if (permalink) {
            const parsed = parsePermalink(permalink);
            if (parsed) {
                const hash = getPermalinkHash(permalink);
                const idMatches = hash && (el.id === hash || !!el.querySelector(`[id="${CSS.escape(hash)}"]`));
                const hasBody = !!el.querySelector(COMMENT_BODY_SELECTOR);
                if (idMatches || hasBody) {
                    return {
                        container: el, permalink, parsed, optionsBtn: findOptionsButton(el),
                    };
                }
            }
        }
        el = el.parentElement;
    }
    return null;
}

// After the mutation succeeds, hide the comment box locally so the user sees the
// collapse without needing to refresh. GitHub re-renders this as its native
// "Show comment" collapsed state on the next page load.
function collapseCommentBox(wrapper) {
    let el = wrapper.parentElement;
    while (el && el !== document.body) {
        if (el.querySelector(COMMENT_BODY_SELECTOR)) {
            el.style.display = 'none';
            return;
        }
        el = el.parentElement;
    }
}

function lookupNodeId(commentType, commentId) {
    if (commentType === 'pullrequestreview') {
        return API.getPullRequestReviewNodeId(commentId);
    }
    if (commentType === 'pullrequestreviewcomment') {
        return API.getPullRequestReviewCommentNodeId(commentId);
    }
    return API.getIssueCommentNodeId(commentId);
}

async function handleClick(event) {
    const button = event.currentTarget;
    const wrapper = button.closest(`.${BUTTONS_CLASS}`);
    const commentId = wrapper && wrapper.dataset.commentId;
    const commentType = wrapper && wrapper.dataset.commentType;
    const classifier = button.dataset.classifier;
    if (!commentId || !commentType || !classifier) {
        return;
    }
    $(wrapper).find('button').prop('disabled', true);
    try {
        const nodeId = await lookupNodeId(commentType, commentId);
        await API.minimizeComment(nodeId, classifier);
        collapseCommentBox(wrapper);
    } catch (e) {
        console.error('Failed to hide comment', e);
        $(wrapper).find('button').prop('disabled', false);
    }
}

function addButtons({
    container, permalink, parsed, optionsBtn,
}) {
    if ($(container).find(`.${BUTTONS_CLASS}`).length) {
        return;
    }

    // A PR review with a body carries its id on both an outer wrapper (the
    // "reviewed" line) and the inner comment box (the "left a comment" box), so
    // the scan reaches the same review from two different author links. Guard by
    // comment id so the review can't collect a second set of buttons.
    if (document.querySelector(`.${BUTTONS_CLASS}[data-comment-id="${CSS.escape(parsed.id)}"][data-comment-type="${CSS.escape(parsed.type)}"]`)) {
        return;
    }

    const wrapper = document.createElement('span');
    wrapper.className = `${BUTTONS_CLASS} k2-element`;
    wrapper.dataset.commentId = parsed.id;
    wrapper.dataset.commentType = parsed.type;
    ACTIONS.forEach((action) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm k2-hide-comment-button';
        btn.dataset.classifier = action.classifier;
        btn.textContent = action.label;
        btn.addEventListener('click', handleClick);
        wrapper.appendChild(btn);
    });

    // Prefer placing the buttons immediately before the "..." kebab so they sit
    // in the comment header actions. The legacy kebab is a <summary> inside a
    // <details>, so anchor on the <details> to avoid dropping the buttons inside
    // the disclosure. If no kebab is found (some layouts render it differently),
    // fall back to right after the timestamp permalink.
    if (optionsBtn && optionsBtn.length) {
        const anchor = optionsBtn[0];
        const target = anchor.tagName === 'SUMMARY' ? (anchor.closest('details') || anchor) : anchor;
        target.parentNode.insertBefore(wrapper, target);
    } else {
        permalink.parentNode.insertBefore(wrapper, permalink.nextSibling);
    }
}

function scan() {
    $(AUTHOR_SELECTOR).each((i, authorLink) => {
        if (!isHeaderAuthorLink(authorLink)) {
            return;
        }
        const header = findCommentHeader(authorLink);
        if (!header) {
            return;
        }
        addButtons(header);
    });
}

function scheduleScan() {
    if (scanScheduled) {
        return;
    }
    scanScheduled = true;
    requestAnimationFrame(() => {
        scanScheduled = false;
        scan();
    });
}

function initHideCommentButtons() {
    if (observer) {
        return;
    }
    scheduleScan();
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, {childList: true, subtree: true});
}

// eslint-disable-next-line import/prefer-default-export
export {initHideCommentButtons};
