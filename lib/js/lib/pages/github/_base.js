'use strict';

/**
 * This class is to be extended by each of the pages that we want to do things on.
 */

let $ = require('jquery');

module.exports = function() {
  let Page = {};

  /**
   * A uniqeu identifier for each page
   *
   * @type {String}
   */
  Page.id = '';

  /**
   * A string to match the last part of the URL path to
   * determine if this is a page we want to do anything on
   *
   * @type {String}
   */
  Page.urlPath = '';

  Page.init = function() {
    // We need to special case the homepage where there is an empty pathname
    if (this.urlPath === ''
      && (window.location.pathname === '' || window.location.pathname === '/')) {
      return this.setup();
    }

    if (this.urlPath === '' && window.location.pathname !== '') {
      return;
    }

    // Check if this page matches our URL path
    let regex = new RegExp(this.urlPath);

    // console.log(window.location.pathname, this.urlPath, regex);

    // Do a regex test to see if this page matches
    // the urlPath regex
    if (regex.test(window.location.pathname)) {
      // console.log('page matched')
      this.setup();
    }
  };

  /**
   * This is the method that is ran after a page has matched the URL.
   * All the magic should start here.
   *
   * This should be extended for each page type.
   */
  Page.setup = function() {};

  Page.getRepoOwner = function() {
    return $('.author a span').text();
  };

  /**
   * Gets the name of the repo
   *
   * @return {string}
   */
  Page.getRepo = function() {
    return $('.js-current-repository').text();
  };

  Page.getSrcUrl = function() {
    return window.location.href;
  };

  return Page;
};
