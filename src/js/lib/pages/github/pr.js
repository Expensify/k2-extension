import $ from 'jquery';
import Base from './_base';

/**
 * Replaces all `- [ ]` with `- [x]` in textareas with specific names
 */
const replaceChecklistItems = () => {
    // eslint-disable-next-line rulesdir/prefer-underscore-method
    $('textarea[name="issue[body]"], textarea[name="issue_comment[body]"], textarea[name="comment[body]"], textarea[name="pull_request[body]"]').each((i, el) => {
        const updatedText = $(el).val().replace(/- \[ \]/g, '- [x]');
        $(el).val(updatedText);
    });
};

const renderReplaceChecklistButton = () => {
    if ($('.k2-replace-checklist').length) {
        return;
    }
    const buttonHtml = '<button type="button" class="btn-link no-underline text-bold Link--primary k2-replace-checklist hidden">Auto complete checklist</button>';
    $('.discussion-sidebar-item').last().append(buttonHtml);
    $('.k2-replace-checklist').off().on('click', replaceChecklistItems);
};

const refreshHold = function () {
    const prTitle = $('.js-issue-title').text();

    const isNewMergeUI = $('div[data-testid="mergebox-partial"]').length;

    // Classic merge experience
    if (!isNewMergeUI) {
        if (prTitle.toLowerCase().indexOf('[hold') > -1 || prTitle.toLowerCase().indexOf('[wip') > -1) {
            $('.branch-action') // Entire PR merge section
                .removeClass('branch-action-state-clean')
                .addClass('branch-action-state-dirty');
            $('.merge-message button') // Merge pull request button
                .removeClass('btn-primary')
                .attr('disabled', 'disabled');
            // eslint-disable-next-line rulesdir/prefer-underscore-method
            $('.branch-action-item').last().find('.completeness-indicator') // "Merging status" section above the merge button
                .removeClass('completeness-indicator-success')
                .addClass('completeness-indicator-problem')
                .end()
                .find('.status-heading') // Header for the "merging status" section
                .text('This pull request has a hold on it and cannot be merged')
                .end()
                .find('.status-meta') // Body text for the "merging status" section
                .html('Remove the HOLD or WIP label from the title of the PR to make it mergeable')
                .end()
                .find('.octicon')
                .removeClass('octicon-check')
                .addClass('octicon-alert');
        }
        return;
    }

    if (prTitle.toLowerCase().indexOf('[hold') > -1 || prTitle.toLowerCase().indexOf('[wip') > -1) {
        $('div[data-testid="mergebox-partial"] > div > div:last-of-type') // Entire PR merge section
            .removeClass('borderColor-success-emphasis');
        $('div[data-testid="mergebox-partial"] > div > div > div button').first() // Merge pull request button
            .css({backgroundColor: 'var(--bgColor-neutral-muted)', borderColor: 'var(--bgColor-neutral-muted)'})
            .attr('disabled', 'disabled');
        $('div[data-testid="mergebox-partial"] > div > div button[data-component="IconButton"]').first() // Dropdown button next to merge button
            .css({backgroundColor: 'var(--bgColor-neutral-muted)', borderColor: 'var(--bgColor-neutral-muted)'})
            .attr('disabled', 'disabled');
        $('div[data-testid="mergebox-partial"] > div > div > div > div > div') // Container for merge pull request button
            .css({borderColor: 'var(--bgColor-neutral-muted)'});
        $('div[data-testid="mergeability-icon-wrapper"] div').css({backgroundColor: 'var(--bgColor-neutral-emphasis)'}); // Icon on the left side of the merge panel
        $('div[data-testid="mergebox-partial"] > div > div > section:last-of-type svg') // "Merging status" section above the merge button
            .parent()
            .removeClass('bgColor-success-emphasis')
            .css({backgroundColor: 'var(--bgColor-neutral-emphasis)'});
        $('div[data-testid="mergebox-partial"] > div > div > section:last-of-type h3') // Header for the "merging status" section
            .text('This pull request has a hold on it and cannot be merged');
        $('div[data-testid="mergebox-partial"] > div > div > section:last-of-type p') // Body text for the "merging status" section
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
        setInterval(renderReplaceChecklistButton, 2000);

        // Waiting 2 seconds to call this gives the page enough time to load so that there is a better chance that all the comments will be rendered
        setInterval(() => PrPage.renderCopyChecklistButtons('reviewer'), 2000);
    };

    return PrPage;
}

