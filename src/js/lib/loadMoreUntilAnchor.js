import _ from 'underscore';

// When a link pointing at an anchor on the current issue/PR is clicked (eg. a link to
// #issuecomment-123 or https://github.com/org/repo/pull/1#discussion_r456) and the targeted
// comment hasn't been loaded into the timeline yet, keep clicking GitHub's "Load more"
// controls until the target shows up, then scroll to it.

// Selectors for the controls that load hidden timeline items. GitHub keeps the same React
// timeline button in the DOM between loads, so these can be clicked repeatedly.
const LOAD_MORE_SELECTORS = [
    'button[data-testid^="issue-timeline-load-more-"]',
    'button[data-testid="hidden-items-expander"]',
    'button.ajax-pagination-btn',
].join(', ');

// How often to check whether the target has appeared and whether another load is needed.
const POLL_INTERVAL_MS = 250;

// Give up if the target still hasn't appeared after this long, eg. because the anchor
// doesn't belong to a timeline item at all.
const MAX_DURATION_MS = 30000;

// Give up if there has been no load more control available for this long, which means the
// whole timeline is already loaded and the target isn't in it.
const MAX_IDLE_MS = 3000;

let initialized = false;
let activeSearch = null;

/**
 * @param {String} hash URL hash without the leading "#"
 * @returns {Element|null}
 */
function findTarget(hash) {
    // getElementById instead of querySelector because anchors like #1234 are not valid
    // CSS selectors and would throw. Markdown heading anchors are rendered with a
    // "user-content-" prefix.
    return document.getElementById(hash) || document.getElementById(`user-content-${hash}`);
}

/**
 * @param {Element} el
 * @returns {Boolean}
 */
function isClickable(el) {
    return !el.disabled
        && el.getAttribute('aria-disabled') !== 'true'
        && el.getAttribute('data-loading') !== 'true'
        && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

/**
 * Returns the issue/PR the path belongs to (eg. /org/repo/pull/123), so that links to
 * /org/repo/pull/123 and /org/repo/pull/123/ are treated as the same page.
 *
 * @param {String} pathname
 * @returns {String}
 */
function getIssuePath(pathname) {
    return pathname.replace(/\/+$/, '');
}

function stopSearch() {
    if (!activeSearch) {
        return;
    }
    clearInterval(activeSearch.intervalID);
    activeSearch = null;
}

/**
 * @param {String} hash URL hash without the leading "#"
 */
function startSearch(hash) {
    stopSearch();

    const startedAt = Date.now();
    let lastLoadAt = startedAt;

    const search = {hash};
    activeSearch = search;

    const tick = () => {
        if (activeSearch !== search) {
            return;
        }

        const target = findTarget(hash);
        if (target) {
            stopSearch();
            target.scrollIntoView();
            return;
        }

        const now = Date.now();
        if (now - startedAt > MAX_DURATION_MS) {
            stopSearch();
            return;
        }

        const buttons = document.querySelectorAll(LOAD_MORE_SELECTORS);
        const isLoading = _.some(buttons, el => el.getAttribute('data-loading') === 'true');
        const clickable = _.filter(buttons, isClickable);

        if (clickable.length === 0) {
            if (!isLoading && now - lastLoadAt > MAX_IDLE_MS) {
                stopSearch();
            }
            return;
        }

        lastLoadAt = now;
        _.each(clickable, el => el.click());
    };

    search.intervalID = setInterval(tick, POLL_INTERVAL_MS);
    tick();
}

/**
 * @param {MouseEvent} event
 */
function onClick(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || (link.target && link.target !== '_self')) {
        return;
    }

    let url;
    let hash;
    try {
        url = new URL(link.getAttribute('href'), window.location.href);
        hash = decodeURIComponent(url.hash.slice(1));
    } catch (e) {
        return;
    }

    if (!hash
        || url.origin !== window.location.origin
        || getIssuePath(url.pathname) !== getIssuePath(window.location.pathname)
        || findTarget(hash)) {
        return;
    }

    startSearch(hash);
}

function initLoadMoreUntilAnchor() {
    if (initialized) {
        return;
    }
    initialized = true;

    // Capture phase so we still hear about clicks whose propagation GitHub stops.
    document.addEventListener('click', onClick, {capture: true});

    // Any user scroll means they have moved on, so we shouldn't yank them to the target.
    ['wheel', 'touchstart', 'keydown'].forEach(eventName => window.addEventListener(eventName, stopSearch, {capture: true, passive: true}));
}

// eslint-disable-next-line import/prefer-default-export
export {initLoadMoreUntilAnchor};
