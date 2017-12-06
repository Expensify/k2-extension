'use strict';

/**
 * This pages manages the new issue page
 */

const $ = require('jquery');
const Base = require('./_base');

module.exports = function () {
  const IssueNewPage = new Base();

  /**
   * Add buttons to the page and setup the event handler
   */
  IssueNewPage.urlPath = '^(/[\\w-]+/[\\w-]+/issues/new)$';

  /**
   * Add buttons to the page and setup the event handler
   */
  IssueNewPage.setup = function() {
    console.log('new issue page setup', $('.k2picker-wrapper, .k2pickerarea-wrapper, .k2pickertype-wrapper, .k2togglereviewing-wrapper').length);
    $('.k2picker-wrapper, .k2pickerarea-wrapper, .k2pickertype-wrapper, .k2togglereviewing-wrapper').remove();
  };

  return IssueNewPage;
};
