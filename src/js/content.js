// Import the style sheet here so that it is included by webpack and processed from SASS into CSS
// eslint-disable-next-line no-unused-vars
import styles from '../css/content.scss';

import * as messenger from './lib/messenger';
import ghAll from './lib/pages/github/all';
import ghPr from './lib/pages/github/pr';
import ghIssue from './lib/pages/github/issue';
import ghIssuenew from './lib/pages/github/issuenew';
import ghIssueChoose from './lib/pages/github/issuechoose';
import ghMain from './lib/pages/github/main';

const pages = [
    ghAll(),
    ghPr(),
    ghIssue(),
    ghIssuenew(),
    ghIssueChoose(),
    ghMain(),
];

/**
 * Clean up K2 state when NOT on K2 page.
 * Runs on every navigation because MainPage.setup only matches the repo root URL.
 */
function cleanupK2State() {
    if (window.location.hash.indexOf('#k2') === 0) {
        return;
    }
    document.body.classList.remove('k2-page-active');
    const k2Link = document.querySelector('.k2-nav-link');
    if (k2Link) {
        k2Link.classList.remove('selected');
        k2Link.removeAttribute('aria-current');
    }
}

/**
 * Get all of the page classes and call their init methods
 *
 * @returns {void}
 */
function setupPages() {
    // Always cleanup K2 state first on every navigation
    cleanupK2State();

    for (let i = 0; i < pages.length; i++) {
        pages[i].init();
    }
}

// The message listener needs to be started so that the background script can trigger events to happen in the extension
messenger.startMessageListener();

// The nav event is triggered anytime a page is navigated on GitHub
messenger.on('nav', () => setupPages());

// Listen for hash changes (e.g., clicking the K2 tab) to re-run page setup
window.addEventListener('hashchange', () => setupPages());

// Handle K2 link clicks directly — GitHub's React nav intercepts clicks and uses
// pushState (which doesn't fire hashchange), so we must handle it ourselves.
document.addEventListener('click', (e) => {
    const link = e.target.closest('.k2-nav-link');
    if (!link) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Extract the target pathname from the link's href (without the hash)
    const linkUrl = new URL(link.href, window.location.origin);
    const targetPathname = linkUrl.pathname;

    // Check if we're on the right pathname AND the .repository-content container exists.
    // If the container is missing (e.g., after GitHub's SPA navigation from Code tab),
    // we need a full page reload to get GitHub to render the proper DOM.
    const repoContent = document.querySelector('.repository-content');
    if (window.location.pathname === targetPathname && repoContent) {
        window.location.hash = '#k2';
        setupPages();
    } else if (window.location.pathname === targetPathname) {
        // Same pathname but missing .repository-content - need to force reload.
        // Just setting href won't reload because browser sees same pathname as hash-only change.
        window.location.hash = '#k2';
        window.location.reload();
    } else {
        // Different pathname - navigate to the K2 page
        window.location.href = link.href;
    }
});

setupPages();
