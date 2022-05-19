import $ from 'jquery';
import Base from './_base';
import * as API from '../../api';

/**
 * Check whether or not the current repo allows someone to merge their own PR that they created. This is limited
 * to specific repos in infra.
 *
 * @return {boolean}
 */
function isSelfMergingAllowed() {
    const reposAllowSelfMerge = [
        'salt',
        'ops-configs',
        'terraform',
    ];
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
        // eslint-disable-next-line rulesdir/prefer-underscore-method
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
        // eslint-disable-next-line rulesdir/prefer-underscore-method
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

/**
 * This class handles what happens on the pull request page
 *
 * @returns {Object}
 */
export default function () {
    const PrPage = new Base();

    /**
     * Add buttons to the page and setup the event handler
     */
    PrPage.urlPath = '^(/[\\w-]+/[\\w-]+/pull/[0-9]+/?(?:/commits)?(?:/files)?)$';

    /**
     * Add buttons to the page and setup the event handler
     */
    PrPage.setup = function () {
        setInterval(refreshHold, 1000);
    };

    return PrPage;
}
