
/**
 * This pages manages the pull requests page, the qa guidelines is copied from createpr.js
 */

const $ = require('jquery');
const Base = require('./_base');
const API = require('../../api');

const reposAllowSelfMerge = [
    'salt',
    'ops-configs',
    'terraform',
];

function isSelfMergingAllowed() {
    const repoName = window.location.pathname.split('/')[2].toLowerCase();

    return reposAllowSelfMerge.indexOf(repoName) > -1;
}

const refreshHold = function () {
    const prTitle = $('.js-issue-title').text();
    const prAuthor = $('.pull-header-username').text();
    const getCurrentUser = API.getCurrentUser();
    const branchName = $('.head-ref').text();

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
            .html('Remove the HOLD or WIP label from the title of the PR to make it mergeable')
            .end()
            .find('.octicon')
            .removeClass('octicon-check')
            .addClass('octicon-alert');
    }

    if (!(branchName.toLowerCase() === 'master' || branchName.toLowerCase() === 'main') && !isSelfMergingAllowed() && getCurrentUser === prAuthor) {
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
            .text('You cannot merge your own PR.')
            .end()
            .find('.status-meta')
            .html('I\'m sorry Dave, I\'m afraid you can\'t merge your own PR')
            .end()
            .find('.octicon')
            .removeClass('octicon-check')
            .addClass('octicon-alert');
    }
};

const qaGuidelines = require('../../../template/qa.guidelines.html');
const qaGuidelinesToggle = require('../../../template/qa.guidelines.toggle.html');

// The selectors here differ slighty from createpr.js
const addQAGuidelines = function () {
    const $btnContainer = $('.discussion-timeline .form-actions');
    const $cancelBtn = $btnContainer.find('.js-comment-cancel-button');

    if ($('.k2-extension-qa-guidelines-toggle-container').length > 0) {
        $('.k2-extension-qa-guidelines-toggle-container').remove();
    }

    if ($('.k2-extension-qa-guidelines').length > 0) {
        $('.k2-extension-qa-guidelines').remove();
    }

    $cancelBtn.after(qaGuidelinesToggle);
    $btnContainer.after(qaGuidelines);
};

const toggleQAGuidelines = function () {
    const $qaToggle = $('#k2-extension-qa-guidelines-toggle');

    $('.k2-extension-qa-guidelines').toggleClass('show', $qaToggle.is(':checked'));
};

module.exports = function () {
    const PrPage = new Base();

    /**
   * Add buttons to the page and setup the event handler
   */
    PrPage.urlPath = '^(/[\\w-]+/[\\w-]+/pull/[0-9]+\/?(?:/commits)?(?:/files)?)$';

    /**
   * Add buttons to the page and setup the event handler
   */
    PrPage.setup = function () {
        setInterval(refreshHold, 1000);

        // Add qa guidelines content
        addQAGuidelines();

        // Set event listener to hide/show qa guidelines
        $('#k2-extension-qa-guidelines-toggle').on('change', toggleQAGuidelines);
    };

    return PrPage;
};
