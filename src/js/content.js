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
 * Get all of the page classes and call their init methods
 *
 * @returns {void}
 */
function setupPages() {
    for (let i = 0; i < pages.length; i++) {
        pages[i].init();
    }
}

// The message listener needs to be started so that the background script can trigger events to happen in the extension
messenger.startMessageListener();

// The nav event is triggered anytime a page is navigated on GitHub
messenger.on('nav', setupPages);

// Listen for hash changes (e.g., clicking the K2 tab) to re-run page setup
window.addEventListener('hashchange', setupPages);

setupPages();
