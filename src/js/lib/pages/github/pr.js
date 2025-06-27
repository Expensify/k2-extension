import $ from 'jquery';
import Base from './_base';
import WorkflowDispatch from '../../../module/WorkflowDispatch/WorkflowDispatch';

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

const refreshWorkflowDispatch = function () {
    // If the wrapper already exists, just redraw the component
    if ($('.workflowdispatch-wrapper').length) {
        new WorkflowDispatch().draw();
        return;
    }

    // Create just the workflow dispatch wrapper element
    const workflowDispatchWrapper = '<div class="discussion-sidebar-item js-discussion-sidebar-item workflowdispatch-wrapper"></div>';

    // Try multiple selectors to find the right place in the PR sidebar
    let sidebarTarget = null;

    // Try the labels section first (same as issue page)
    if ($('div[data-testid="issue-viewer-metadata-pane"] > :nth-child(4)').length) {
        sidebarTarget = $('div[data-testid="issue-viewer-metadata-pane"] > :nth-child(4)');
    } else if ($('div[data-testid="pr-review-metadata"] .discussion-sidebar-item').last().length) {
        // Try alternative selector for PR sidebar
        sidebarTarget = $('div[data-testid="pr-review-metadata"] .discussion-sidebar-item').last();
    } else if ($('.discussion-sidebar-item').last().length) {
        // Try another alternative - look for any sidebar item in the metadata pane
        sidebarTarget = $('.discussion-sidebar-item').last();
    }

    if (sidebarTarget) {
        sidebarTarget.after(workflowDispatchWrapper);
        new WorkflowDispatch().draw();
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

        // Draw the workflow dispatch button once when the page is loaded
        setTimeout(refreshWorkflowDispatch, 500);

        // Every second, check to see if the workflow dispatch button is still there, and if not, redraw it
        setInterval(() => {
            if ($('.workflowdispatch-wrapper').length) {
                return;
            }
            refreshWorkflowDispatch();
        }, 1000);

        // Waiting 2 seconds to call this gives the page enough time to load so that there is a better chance that all the comments will be rendered
        setInterval(() => PrPage.renderCopyChecklistButtons('reviewer'), 2000);
    };

    return PrPage;
}

