import $ from 'jquery';

// Matches the visible text on every comment-pagination control we want to auto-click.
// Anchored at the start of the trimmed text so we don't match buttons that merely contain
// these words inside a longer label.
const LOAD_MORE_TEXT = /^(load more|show\s+(\d+|hidden)\s+(hidden|earlier|more|previous|outdated)\s+(item|comment|conversation))/i;

const SCOPES = [
    '.js-discussion',
    '[data-testid="issue-viewer-timeline"]',
    '[data-testid="pull-request-timeline"]',
    '.js-resolvable-timeline-thread-container',
    '.review-thread-component',
].join(', ');

// Survives across observer callbacks so we don't re-click a button while GitHub is still
// tearing it down and replacing it.
const clicked = new WeakSet();

let observer = null;
let scanScheduled = false;

function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function clickOnce(el) {
    if (!el || clicked.has(el) || el.disabled || !isVisible(el)) {
        return;
    }
    clicked.add(el);
    el.click();
}

function scan() {
    // eslint-disable-next-line rulesdir/prefer-underscore-method
    $('button.ajax-pagination-btn').each((i, el) => clickOnce(el));

    // eslint-disable-next-line rulesdir/prefer-underscore-method
    $('button[data-testid="hidden-items-expander"]').each((i, el) => clickOnce(el));

    // eslint-disable-next-line rulesdir/prefer-underscore-method
    $(SCOPES).find('button, a').each((i, el) => {
        const text = (el.textContent || '').trim();
        if (LOAD_MORE_TEXT.test(text)) {
            clickOnce(el);
        }
    });
}

// Coalesce bursts of mutations into a single scan per animation frame so that the rapid
// stream of DOM changes during page load doesn't trigger a scan per node.
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

function initAutoLoadMoreComments() {
    if (observer) {
        return;
    }
    scheduleScan();
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, {childList: true, subtree: true});
}

// eslint-disable-next-line import/prefer-default-export
export {initAutoLoadMoreComments};
