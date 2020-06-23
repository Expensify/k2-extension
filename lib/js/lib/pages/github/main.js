'use strict';

/**
 * This pages manages the pull requests page
 */

let $ = require('jquery');
let Base = require('./_base');
let Dashboard = require('../../../module/dashboard/index');
let WhatsNext = require('../../../module/whatsnext/index');

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
      // Deselect whatever button is currently selected
      $('.reponav-item.selected').removeClass('selected');

      // Deselect currently-selected button in new UI
      const selected = $('.js-selected-navigation-item.selected');
      selected.removeClass('selected');
      selected.removeAttr('aria-current');

      // Select our k2 button
      $('.reponav-item.k2-extension').addClass('selected');

      // Select our K2 button in new UI
      const k2tab = $('.js-selected-navigation-item.k2-extension');
      k2tab.addClass('selected');
      k2tab.attr('aria-current', 'page');

      document.title = 'K2';

      const issues = new Dashboard();
      issues.draw();
      return;
    }

    if (window.location.hash.search('#whatsnext') === 0) {
      // Deselect the code button
      $('.reponav-item.selected').removeClass('selected');

      // Deselect currently-selected button in new UI
      const selected = $('.js-selected-navigation-item.selected');
      selected.removeClass('selected');
      selected.removeAttr('aria-current');

      // Select our what's next button
      $('.reponav-item.k2-whatsnext').addClass('selected');

      // Select our WN button in new UI
      const wnTab = $('.js-selected-navigation-item.k2-whatsnext');
      wnTab.addClass('selected');
      wnTab.attr('aria-current', 'page');

      document.title = 'What\'s Next';

      const whatsNext = new WhatsNext();
      whatsNext.draw();
      return;
    }
  };

  return MainPage;
};
