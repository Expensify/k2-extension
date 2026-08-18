import _ from 'underscore';
import * as API from './api';

const ACTIONS = [
    {classifier: 'OFF_TOPIC', label: 'Off-topic'},
    {classifier: 'OUTDATED', label: 'Outdated'},
    {classifier: 'RESOLVED', label: 'Resolved'},
];

const BUTTONS_CLASS = 'k2-hide-comment-buttons';

const COMMENT_BODY_SELECTOR = '.comment-body.js-comment-body, .comment-body, [data-testid="issue-comment-body"], [data-testid="markdown-body"]';
const MODERN_ISSUE_COMMENT_SELECTOR = '[class*="IssueBody-module__commentBorder"]:not([class*="IssueBodyHeader-module__commentBorder"])';
const COMMENT_CONTAINER_SELECTOR = `.timeline-comment, .timeline-comment-group, .react-issue-comment, ${MODERN_ISSUE_COMMENT_SELECTOR}`;

// Match the comment type needed by the REST endpoint that returns its GraphQL node ID.
// Check review-thread comments before review comments because their URLs overlap.
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

    return !!btn.querySelector('.octicon-kebab-horizontal, [class*="KebabHorizontal"]');
}

// The React UI uses a button. The legacy review UI uses a summary element.
function findOptionsButton(container) {
    return _.find(container.querySelectorAll('button, summary'), btn => isOptionsButton(btn)) || null;
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

function getCommentContainer(element) {
    return element.closest(COMMENT_CONTAINER_SELECTOR);
}

// Start from the permalink, which belongs to a specific comment. Starting from an
// author link can pair the issue description with a later timeline comment.
function findCommentContext(permalink) {
    const parsed = parsePermalink(permalink);
    if (!parsed) {
        return null;
    }

    const hash = getPermalinkHash(permalink);
    const target = hash && document.getElementById(hash);
    const targetHasCommentBody = target && target.contains(permalink) && target.querySelector(COMMENT_BODY_SELECTOR);
    const container = targetHasCommentBody
        ? target
        : getCommentContainer(permalink);
    if (!container || !container.querySelector(COMMENT_BODY_SELECTOR)) {
        return null;
    }

    return {
        container, permalink, parsed, optionsBtn: findOptionsButton(container),
    };
}

function getMinimizeForm(wrapper) {
    const comment = getCommentContainer(wrapper);
    return comment && comment.querySelector('form.js-timeline-comment-minimize');
}

// Render the same state that GitHub uses when the native form is unavailable.
function showMinimizedComment(wrapper) {
    const comment = getCommentContainer(wrapper);
    const body = comment && comment.querySelector(COMMENT_BODY_SELECTOR);
    if (!comment || !body) {
        return;
    }

    const minimized = document.createElement('div');
    minimized.className = 'k2-minimized-comment';
    minimized.textContent = body.textContent.trim() || 'This comment has been minimized.';

    const issueCommentBody = body.closest('[class*="IssueCommentViewer-module__IssueCommentBody"]');
    if (issueCommentBody) {
        issueCommentBody.replaceChildren(minimized);
        return;
    }

    const header = comment.querySelector('.timeline-comment-header, [class*="IssueBodyHeader-module__IssueBodyHeaderContainer"]');
    const bodyContainer = body.closest('.edit-comment-hide') || body;
    if (header) {
        header.style.display = 'none';
    }
    bodyContainer.style.display = 'none';
    comment.classList.remove('unminimized-comment');
    comment.classList.add('minimized-comment', 'position-relative');
    comment.appendChild(minimized);
}

function lookupNodeID(commentType, commentID) {
    if (commentType === 'pullrequestreview') {
        return API.getPullRequestReviewNodeID(commentID);
    }
    if (commentType === 'pullrequestreviewcomment') {
        return API.getPullRequestReviewCommentNodeID(commentID);
    }
    return API.getIssueCommentNodeID(commentID);
}

function setButtonsDisabled(wrapper, disabled) {
    _.each(wrapper.querySelectorAll('button'), (button) => {
        if (disabled) {
            button.setAttribute('disabled', 'disabled');
        } else {
            button.removeAttribute('disabled');
        }
    });
}

async function minimizeComment(event) {
    const button = event.currentTarget;
    const wrapper = button.closest(`.${BUTTONS_CLASS}`);
    const commentID = wrapper && wrapper.dataset.commentId;
    const commentType = wrapper && wrapper.dataset.commentType;
    const classifier = button.dataset.classifier;
    if (!commentID || !commentType || !classifier) {
        return;
    }
    setButtonsDisabled(wrapper, true);
    const form = getMinimizeForm(wrapper);
    if (form) {
        const select = form.querySelector('select[name="classifier"]');
        if (select) {
            select.value = classifier;
            form.requestSubmit();
            return;
        }
    }
    try {
        const nodeID = await lookupNodeID(commentType, commentID);
        await API.minimizeComment(nodeID, classifier);
        showMinimizedComment(wrapper);
    } catch (error) {
        setButtonsDisabled(wrapper, false);
        wrapper.title = error instanceof Error ? error.message : 'Failed to hide comment';
    }
}

function addButtons({
    container, permalink, parsed, optionsBtn,
}) {
    if (container.querySelector(`.${BUTTONS_CLASS}`)) {
        return;
    }

    // A review can render more than one author link. Prevent duplicate button groups.
    if (document.querySelector(`.${BUTTONS_CLASS}[data-comment-id="${CSS.escape(parsed.id)}"][data-comment-type="${CSS.escape(parsed.type)}"]`)) {
        return;
    }

    const wrapper = document.createElement('span');
    wrapper.className = `${BUTTONS_CLASS} k2-element`;
    wrapper.dataset.commentId = parsed.id;
    wrapper.dataset.commentType = parsed.type;
    _.each(ACTIONS, (action) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm k2-hide-comment-button';
        btn.dataset.classifier = action.classifier;
        btn.textContent = action.label;
        btn.addEventListener('click', minimizeComment);
        wrapper.appendChild(btn);
    });

    // Place buttons before the kebab when GitHub exposes the action menu.
    if (optionsBtn) {
        const anchor = optionsBtn;
        const target = anchor.tagName === 'SUMMARY' ? (anchor.closest('details') || anchor) : anchor;
        target.parentNode.insertBefore(wrapper, target);
    } else {
        permalink.parentNode.insertBefore(wrapper, permalink.nextSibling);
    }
}

function scan() {
    _.each(document.querySelectorAll(PERMALINK_SELECTOR), (permalink) => {
        const comment = findCommentContext(permalink);
        if (!comment) {
            return;
        }
        addButtons(comment);
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

export default initHideCommentButtons;
