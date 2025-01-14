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

/**
 * Gets the contents of the reviewer checklist from GitHub and then posts it as a comment to the current PR
 * @param {Event} e
 */
const copyReviewerChecklist = (e) => {
    e.preventDefault();
    const pathToChecklist = 'https://raw.githubusercontent.com/Expensify/App/main/contributingGuides/REVIEWER_CHECKLIST.md';
    $.get(pathToChecklist)
        .done((fileContents) => {
            if (!fileContents) {
                console.error(`could not load contents of ${pathToChecklist} for some reason`);
                return;
            }

            API.addComment(fileContents);
        });
};

const renderCopyChecklistButton = () => {
    // Look through all the comments on the page to find one that has the template for the copy/paste checklist button
    // eslint-disable-next-line rulesdir/prefer-underscore-method
    $('.markdown-body > p').each((i, el) => {
        const commentHtml = $(el).html();

        // When the button template is found, replace it with an HTML button and then put that back into the DOM so someone can click on it
        if (commentHtml && commentHtml.indexOf('you can simply click: [this button]') > -1) {
            const newHtml = commentHtml.replace('[this button]', '<button type="button" class="btn btn-sm k2-copy-checklist">HERE</button>');
            $(el).html(newHtml);

            // Now that the button is on the page, add a click handler to it (always remove all handlers first so that we know there will always be one handler attached)
            $('.k2-copy-checklist').off().on('click', copyReviewerChecklist);
        }
    });
};

const refreshHold = function () {
    const prTitle = $('.js-issue-title').text();
    const prAuthor = $('.gh-header-meta .author').text();
    const getCurrentUser = API.getCurrentUser();
    const branchName = $('.head-ref span').text();

    const isNewMerge = $('div[data-testid="mergebox-partial"]').length;

    // Classic merge experience
    if (!isNewMerge) {
        if (prTitle.toLowerCase().indexOf('[hold') > -1 || prTitle.toLowerCase().indexOf('[wip') > -1) {
            $('.branch-action') // entire section
                .removeClass('branch-action-state-clean')
                .addClass('branch-action-state-dirty');
            $('.merge-message button') // merge pull request button
                .removeClass('btn-primary')
                .attr('disabled', 'disabled');
            // eslint-disable-next-line rulesdir/prefer-underscore-method
            $('.branch-action-item').last().find('.completeness-indicator') // Last section
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
        return;
    }

    if (prTitle.toLowerCase().indexOf('[hold') > -1 || prTitle.toLowerCase().indexOf('[wip') > -1) {
        $('div[data-testid="mergebox-partial"] > div > div:last-of-type')
            .removeClass('borderColor-success-emphasis');
        $('div[data-testid="mergebox-partial"] > div > div > div button').first() // merge pull request button
            .css({backgroundColor: 'var(--bgColor-neutral-muted)', borderColor: 'var(--bgColor-neutral-muted)'})
            .attr('disabled', 'disabled');
        $('div[data-testid="mergebox-partial"] > div > div button[data-component="IconButton"]').first()
            .css({backgroundColor: 'var(--bgColor-neutral-muted)', borderColor: 'var(--bgColor-neutral-muted)'})
            .attr('disabled', 'disabled');
        $('div[data-testid="mergebox-partial"] > div > div > div > div > div')
            .css({borderColor: 'var(--bgColor-neutral-muted)'});
        $('div[data-testid="mergeability-icon-wrapper"] div').css({backgroundColor: 'var(--bgColor-neutral-emphasis)'});
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        $('div[data-testid="mergebox-partial"] > div > div > section:last-of-type svg') // Last section
            .parent()
            .removeClass('bgColor-success-emphasis')
            .css({backgroundColor: 'var(--bgColor-neutral-emphasis)'});
        $('div[data-testid="mergebox-partial"] > div > div > section:last-of-type h3')
            .text('This pull request has a hold on it and cannot be merged');
        $('div[data-testid="mergebox-partial"] > div > div > section:last-of-type p')
            .html('Remove the HOLD or WIP label from the title of the PR to make it mergeable');
    }

    if (!(branchName.toLowerCase() === 'master' || branchName.toLowerCase() === 'main') && !isSelfMergingAllowed() && getCurrentUser === prAuthor) {
        $('div[data-testid="mergebox-partial"] > div > div:last-of-type')
            .removeClass('borderColor-success-emphasis');
        $('div[data-testid="mergebox-partial"] > div > div > div button').first() // merge pull request button
            .css({backgroundColor: 'var(--bgColor-neutral-muted)', borderColor: 'var(--bgColor-neutral-muted)'})
            .attr('disabled', 'disabled');
        $('div[data-testid="mergebox-partial"] > div > div button[data-component="IconButton"]').first()
            .css({backgroundColor: 'var(--bgColor-neutral-muted)', borderColor: 'var(--bgColor-neutral-muted)'})
            .attr('disabled', 'disabled');
        $('div[data-testid="mergebox-partial"] > div > div > div > div > div')
            .css({borderColor: 'var(--bgColor-neutral-muted)'});
        $('div[data-testid="mergeability-icon-wrapper"] div').css({backgroundColor: 'var(--bgColor-neutral-emphasis)'});
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        $('div[data-testid="mergebox-partial"] > div > div > section:last-of-type svg') // Last section
            .parent()
            .removeClass('bgColor-success-emphasis')
            .css({backgroundColor: 'var(--bgColor-neutral-emphasis)'});
        $('div[data-testid="mergebox-partial"] > div > div > section:last-of-type h3')
            .text('You cannot merge your own PR');
        $('div[data-testid="mergebox-partial"] > div > div > section:last-of-type p')
            .html('It\'s like giving yourself a high-five in public.');
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

        // Waiting 2 seconds to call this gives the page enough time to load so that there is a better chance that all the comments will be rendered
        setInterval(renderCopyChecklistButton, 2000);
    };

    return PrPage;
}
