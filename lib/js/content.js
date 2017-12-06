'use strict';

let messenger = require('./lib/messenger');
let pages = [
  require('./lib/pages/github/all')(),
  require('./lib/pages/github/pr')(),
  require('./lib/pages/github/issue')(),
  require('./lib/pages/github/issuenew')(),
  require('./lib/pages/github/main')()
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
