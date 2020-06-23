'use strict';

/**
 * This pages manages the branch pages
 */

let $ = require('jquery');
let Base = require('./_base');
let k2Button = require('../../../template/button.github.k2.html');
let k2ButtonNew = require('../../../template/button.github.k2.new.html');
let whatsnextButton = require('../../../template/button.github.whatsnext.html');
let whatsnextButtonNew = require('../../../template/button.github.whatsnext.new.html');

module.exports = function() {
  let AllPages = new Base();

  AllPages.init = function() {
    this.setup();
  };

  /**
   * Add buttons to the page and setup the event handler
   */
  AllPages.setup = function() {
    const currentUrl = $('.pagehead h1 strong a').first().attr('href');

    // Insert the what's next button right after the pull request button in the navigation
    // navigation if it's there. Also make sure to not show it multiple times
    if (!$('.reponav-item.k2-whatsnext').length) {
      $('.reponav-item[data-selected-links*="repo_pulls"]')
        .after(whatsnextButton({url: currentUrl}));
    }

    // Also try inserting what's next button with the new UI
    if (!$('nav.js-repo-nav li.k2-whatsnext').length) {
      $('nav.js-repo-nav *[data-selected-links*="repo_pulls"]')
        .parent().after(whatsnextButtonNew({url: currentUrl}));
    }

    // Insert the kernel button right after the pull request button in the
    // navigation if it's there. Also make sure to not show it multiple times
    if (!$('.reponav-item.k2-extension').length) {
      $('.reponav-item[data-selected-links*="repo_pulls"]')
        .after(k2Button({url: currentUrl}));
    }

    // Also try inserting the kernel button with the new UI
    if (!$('nav.js-repo-nav li.k2-extension').length) {
      $('nav.js-repo-nav *[data-selected-links*="repo_pulls"]')
        .parent().after(k2ButtonNew({url: currentUrl}));
    }
  };

  return AllPages;
};
