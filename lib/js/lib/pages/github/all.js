'use strict';

/**
 * This pages manages the branch pages
 */

let $ = require('jquery');
let Base = require('./_base');
let k2Button = require('../../../template/button.github.k2.html');

module.exports = function() {
  let AllPages = new Base();

  AllPages.init = function() {
    this.setup();
  };

  /**
   * Add buttons to the page and setup the event handler
   */
  AllPages.setup = function() {
    const currentUrl = $('.pagehead .container h1 strong a').first().attr('href');

    // Insert the kernel button right after the code button in the navigation
    // if it's there
    // We also make sure to not show it multiple times
    if (!$('.js-repo-nav .k2-extension').length) {
      $('.js-repo-nav [data-hotkey="g w"]')
        .after(k2Button({url: currentUrl}));
    }
  };

  return AllPages;
};
