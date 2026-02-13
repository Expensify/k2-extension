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
 * Clean up K2 state when NOT on K2 page
 * This runs on EVERY navigation to ensure proper cleanup
 */
function cleanupK2State() {
    const isOnK2 = window.location.hash.indexOf('#k2') === 0;

    if (!isOnK2) {
        // Remove K2 active state from body and html
        document.body.classList.remove('k2-page-active');
        document.documentElement.classList.remove('k2-page-active');

        // Remove selected state from K2 nav link
        const k2Link = document.querySelector('.k2-nav-link');
        if (k2Link) {
            k2Link.classList.remove('selected');
            k2Link.removeAttribute('aria-current');
        }
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

setupPages();
