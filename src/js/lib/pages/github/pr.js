import $ from 'jquery';
import Base from './_base';

const refreshHold = function () {
    const prTitle = $('.js-issue-title').text();

    const isNewMergeUI = $('div[data-testid="mergebox-partial"]').length;

    // Classic merge experience
    if (!isNewMergeUI) {
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
        setInterval(() => PrPage.renderCopyChecklistButtons('reviewer'), 2000);

        setTimeout(() => PrPage.renderHoldLinksInTitle($('h1 .js-issue-title'), 5000));
    };

    return PrPage;
}
