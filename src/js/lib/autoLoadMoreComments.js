import $ from 'jquery';
import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../ONYXKEYS';
import * as Preferences from './actions/Preferences';

// Matches the visible text on every comment-pagination control we want to auto-click.
// Anchored at the start of the trimmed text so we don't match buttons that merely contain
// these words inside a longer label.
const LOAD_MORE_TEXT = /^(load more|show\s+(\d+|hidden)\s+(hidden|earlier|more|previous|outdated)\s+(item|comment|conversation))/i;

const SCOPES = [
    '.js-discussion',
    '[data-testid="issue-viewer-timeline"]',
    '[data-testid="issue-timeline-container"]',
    '[data-testid="pull-request-timeline"]',
    '.js-resolvable-timeline-thread-container',
    '.review-thread-component',
].join(', ');

// How long the DOM has to stay quiet after an auto-click before we consider the expansion
// settled and restore the scroll position to the URL's anchor. Content fetched by a click
// can arrive well after the click itself, so every new burst of mutations pushes this back.
const ANCHOR_RESCROLL_DELAY_MS = 500;

// Events that indicate the user is scrolling or otherwise interacting with the page, at
// which point we must not yank their scroll position back to the anchor.
const USER_INTERACTION_EVENTS = ['wheel', 'touchstart', 'mousedown', 'keydown'];

// Survives across observer callbacks so we don't re-click a button while GitHub is still
// tearing it down and replacing it.
const clicked = new WeakSet();

let observer = null;
let scanScheduled = false;
let preferenceSubscribed = false;

// Expanding hidden comments inserts content above the element the URL's anchor
// (eg. #issuecomment-123) points to, pushing it out of the viewport after GitHub's native
// scroll on page load. Once our clicks settle we scroll back to the anchor, unless the user
// has interacted with the page in the meantime.
let anchorRestorePending = false;
let anchorRestoreTimeout = null;
let userHasInteracted = false;
let lastHref = null;

function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function clickOnce(el) {
    if (!el || clicked.has(el) || el.disabled || !isVisible(el)) {
        return;
    }
    clicked.add(el);
    el.click();

    if (window.location.hash && !userHasInteracted) {
        anchorRestorePending = true;
    }
}

function onUserInteraction() {
    userHasInteracted = true;
    anchorRestorePending = false;
    clearTimeout(anchorRestoreTimeout);
}

function scrollToAnchor() {
    anchorRestorePending = false;

    // getElementById instead of querySelector because anchors like #1234 are not valid
    // CSS selectors and would throw.
    const target = document.getElementById(window.location.hash.slice(1));
    if (!target) {
        return;
    }
    target.scrollIntoView();
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

        // GitHub swaps page content in place when navigating, so a new URL means any
        // interaction we saw belonged to the previous page.
        if (window.location.href !== lastHref) {
            lastHref = window.location.href;
            userHasInteracted = false;
        }

        scan();

        // Keep pushing the re-scroll back while mutations are still coming in, so it only
        // fires once the whole expansion cascade has settled.
        if (anchorRestorePending) {
            clearTimeout(anchorRestoreTimeout);
            anchorRestoreTimeout = setTimeout(scrollToAnchor, ANCHOR_RESCROLL_DELAY_MS);
        }
    });
}

function start() {
    if (observer) {
        return;
    }
    lastHref = window.location.href;
    userHasInteracted = false;
    scheduleScan();
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, {childList: true, subtree: true});

    // Capture phase so we still hear about interactions whose propagation GitHub stops.
    USER_INTERACTION_EVENTS.forEach(eventName => window.addEventListener(eventName, onUserInteraction, {capture: true, passive: true}));
}

function stop() {
    if (!observer) {
        return;
    }
    observer.disconnect();
    observer = null;

    USER_INTERACTION_EVENTS.forEach(eventName => window.removeEventListener(eventName, onUserInteraction, {capture: true}));
    clearTimeout(anchorRestoreTimeout);
    anchorRestorePending = false;
}

function initAutoLoadMoreComments() {
    if (preferenceSubscribed) {
        return;
    }
    preferenceSubscribed = true;

    if (Preferences.getAutoLoadMoreComments()) {
        start();
    }

    ReactNativeOnyx.connect({
        key: ONYXKEYS.PREFERENCES,
        callback: () => {
            if (Preferences.getAutoLoadMoreComments()) {
                start();
            } else {
                stop();
            }
        },
    });
}

// eslint-disable-next-line import/prefer-default-export
export {initAutoLoadMoreComments};
