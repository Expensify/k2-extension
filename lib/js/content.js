
import * as messenger from './lib/messenger';
import ghAll from './lib/pages/github/all';
import ghPr from './lib/pages/github/pr';
import ghIssue from './lib/pages/github/issue';
import ghIssuenew from './lib/pages/github/issuenew';
import ghMain from './lib/pages/github/main';
import ghCreatepr from './lib/pages/github/createpr';

const pages = [
    ghAll(),
    ghPr(),
    ghIssue(),
    ghIssuenew(),
    ghMain(),
    ghCreatepr(),
];

/**
 * Get all of our pages and call their init methods
 *
 * @returns {void}
 */
function setupPages() {
    for (let i = 0; i < pages.length; i++) {
        pages[i].init();
    }
}

messenger.startMessageListener();
messenger.on('nav', setupPages);
setupPages();
