
/**
 * This pages manages the create pull requests page, the code is duplicated in pr.js so copy over any changes
 */

const $ = require('jquery');
const Base = require('./_base');
const qaGuidelines = require('../../../template/qa.guidelines.html');
const qaGuidelinesToggle = require('../../../template/qa.guidelines.toggle.html');

const addQAGuidelines = function () {
    const $btnContainer = $('#new_pull_request .discussion-timeline .form-actions');

    if ($('.k2-extension-qa-guidelines-toggle-container').length > 0) {
        $('.k2-extension-qa-guidelines-toggle-container').remove();
    }

    if ($('.k2-extension-qa-guidelines').length > 0) {
        $('.k2-extension-qa-guidelines').remove();
    }

    $btnContainer.prepend(qaGuidelinesToggle);
    $btnContainer.after(qaGuidelines);
};

const toggleQAGuidelines = function () {
    const $qaToggle = $('#k2-extension-qa-guidelines-toggle');

    $('.k2-extension-qa-guidelines').toggleClass('show', $qaToggle.is(':checked'));
};

module.exports = function () {
    const CreatePrPage = new Base();

    /**
     * Regex for the create new PR page
     */
    CreatePrPage.urlPath = '^(/[\\w-]+/[\\w-]+/compare/.*)$';

    /**
     * Runs on page load, adds qa guidelines content and event listener to show/hide the guidelines
     */
    CreatePrPage.setup = function () {
        addQAGuidelines();

        $('#k2-extension-qa-guidelines-toggle').on('change', toggleQAGuidelines);
    };

    return CreatePrPage;
};
