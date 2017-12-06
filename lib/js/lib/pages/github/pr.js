'use strict';

/**
 * This pages manages the pull requests page
 */

let $ = require('jquery');
let Base = require('./_base');

const refreshHold = function () {
  const prTitle = $('.js-issue-title').text();
  if (prTitle.toLowerCase().indexOf('[hold') > -1 || prTitle.toLowerCase().indexOf('[wip') > -1) {
    $('.branch-action')
      .removeClass('branch-action-state-clean')
      .addClass('branch-action-state-dirty');
    $('.merge-message button')
      .removeClass('btn-primary')
      .attr('disabled', 'disabled');
    $('.branch-action-item').last().find('.completeness-indicator')
      .removeClass('completeness-indicator-success')
      .addClass('completeness-indicator-problem')
      .end()
      .find('.status-heading')
      .text('This pull request has a hold on it and cannot be merged')
      .end()
      .find('.status-meta')
      .html('Remove the HOLD or WIP label from the title of the PR to make it mergable')
      .end()
      .find('.octicon')
      .removeClass('octicon-check')
      .addClass('octicon-alert');
  }
};

module.exports = function () {
  let PrPage = new Base();

  /**
   * Add buttons to the page and setup the event handler
   */
  PrPage.urlPath = '^(/[\\w-]+/[\\w-]+/pull/[0-9]+\/?(?:/commits)?(?:/files)?)$';

  /**
   * Add buttons to the page and setup the event handler
   */
  PrPage.setup = function() {
    setInterval(refreshHold, 1000);
  };

  return PrPage;
};
