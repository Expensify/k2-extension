'use strict';

/**
 * This pages manages the pull requests page
 */

let $ = require('jquery');
let Base = require('./_base');
let Dashboard = require('../../../module/dashboard/index');

module.exports = function() {
  let MainPage = new Base();

  /**
   * Add buttons to the page and setup the event handler
   */
  MainPage.urlPath = '^(/[\\w-]+/[\\w-]+/?)$';

  /**
   * Add buttons to the page and setup the event handler
   */
  MainPage.setup = function() {
    // Only do stuff if we are on the kernal page
    if (window.location.hash.search('#k2') === 0) {
      // Deselect the code button
      $('.js-repo-nav [data-hotkey="g c"]').removeClass('selected');
      $('.js-repo-nav .k2-whatsnext').removeClass('selected');

      // Select our k2 button
      $('.js-repo-nav .k2-extension').addClass('selected');

      document.title = 'K2';

      const issues = new Dashboard();
      issues.draw();
      return;
    }

    // if (window.location.hash.search('#whatsnext') === 0) {
    //   // Deselect the code button
    //   $('.js-repo-nav [data-hotkey="g c"]').removeClass('selected');
    //   $('.js-repo-nav .k2-extension').removeClass('selected');
    //
    //   // Select our what's next button
    //   $('.js-repo-nav .k2-whatsnext').addClass('selected');
    //
    //   document.title = 'What\'s Next';
    //
    //   const whatsNext = new WhatsNext();
    //   whatsNext.draw();
    //   return;
    // }
  };

  return MainPage;
};
