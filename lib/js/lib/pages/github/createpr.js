'use strict';

/**
 * This pages manages the create pull requests page
 */

let $ = require('jquery');
let Base = require('./_base');
const qaGuidelines = require('../../../template/qa.guidelines.html');
const qaGuidelinesToggle = require('../../../template/qa.guidelines.toggle.html');

const addQAGuidelines = function () {
  const $btnContainer = $('#new_pull_request .discussion-timeline .form-actions');

  $btnContainer.prepend(qaGuidelinesToggle);
  $btnContainer.after(qaGuidelines);
};

module.exports = function () {
  let CreatePrPage = new Base();

  /**
   *
   */
  CreatePrPage.urlPath = '^(/[\\w-]+/[\\w-]+/compare/.*)$';

  /**
   *a
   */
  CreatePrPage.setup = function() {
    addQAGuidelines();

    const $qaToggle = $('#k2-extension-qa-guidelines-toggle');

    $qaToggle.on('change', () => {
      $('.k2-extension-qa-guidelines').toggleClass('show', $qaToggle.is(':checked'));
    });
  };

  return CreatePrPage;
};
