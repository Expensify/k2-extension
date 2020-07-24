'use strict';

/**
 * This pages manages the branch pages
 */

let $ = require('jquery');
let Base = require('./_base');
let k2Button = require('../../../template/button.github.k2.html');
let whatsnextButton = require('../../../template/button.github.whatsnext.html');

module.exports = function() {
  let AllPages = new Base();

  AllPages.init = function() {
    this.setup();
  };

  /**
   * Add buttons to the page and setup the event handler
   */
  AllPages.setup = function() {
    // Hardcode because it doesn't change, and depending on GitHub markup means
    // it breaks every so often
    const currentUrl = '/Expensify/Expensify';

    // Insert the what's next button right after the pull request button in the navigation
    // navigation if it's there. Also make sure to not show it multiple times
    if (!$('nav.js-repo-nav li.k2-whatsnext').length) {
      $('nav.js-repo-nav *[data-selected-links*="repo_pulls"]')
        .parent().after(whatsnextButton({url: currentUrl}));
    }

    // Insert the kernel button right after the pull request button in the
    // navigation if it's there. Also make sure to not show it multiple times
    if (!$('nav.js-repo-nav li.k2-extension').length) {
      $('nav.js-repo-nav *[data-selected-links*="repo_pulls"]')
        .parent().after(k2Button({url: currentUrl}));
    }
  };

  return AllPages;
};
