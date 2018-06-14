'use strict';

/**
 * This pages manages the create pull requests page
 */

let $ = require('jquery');
let Base = require('./_base');
const qaGuidelines = require('../../../template/qa.guidelines.html');

const addQAGuidelines = function () {
  const $createPRBtn = $('#new_pull_request .discussion-timeline .form-actions');

  $createPRBtn.before(qaGuidelines);
};

const toggleQAGuidelines = function () {
  const $contentBox = $('.new-pr-form .write-content');

  $('.k2-extension-qa-guidelines').toggleClass('show', $contentBox.hasClass('focused'));
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

    $(document).off('click keyup').on('click keyup', toggleQAGuidelines);
  };

  return CreatePrPage;
};
