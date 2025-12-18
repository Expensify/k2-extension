import $ from 'jquery';
import _ from 'underscore';
import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../../api';
import * as Preferences from '../../actions/Preferences';
import ONYXKEYS from '../../../ONYXKEYS';
import convertTimestamps from '../../timestampConverter';

/**
 * This class is to be extended by each of the distinct types of webpages that the extension works on
 * @returns {Object}
 */
export default function () {
    const Page = {};

    const REVIEWER_CHECKLIST_URL = 'https://raw.githubusercontent.com/Expensify/App/main/contributingGuides/REVIEWER_CHECKLIST.md';
    const BUGZERO_CHECKLIST_URL = 'https://raw.githubusercontent.com/Expensify/App/main/contributingGuides/BUGZERO_CHECKLIST.md';

    /**
     * Gets the contents of the reviewer checklist from GitHub and then posts it as a comment to the current PR
     * @param {Event} e
     * @param {'bugzero' | 'reviewer'} checklistType Type of target checklist
     */
    const copyReviewerChecklist = async (e, checklistType) => {
        const checklistUrl = checklistType === 'bugzero' ? BUGZERO_CHECKLIST_URL : REVIEWER_CHECKLIST_URL;

        e.preventDefault();

        // Get the button element
        const button = e.target;

        // Save the original content of the button
        const originalContent = button.innerHTML;

        // Replace the button content with a loader
        button.innerHTML = '<div class="loader" />';

        try {
            // Fetch the checklist contents
            const response = await fetch(checklistUrl);
            const fileContents = await response.text();

            // Call the API to add the comment
            await API.addComment(fileContents);
        } catch (error) {
            console.error('Error fetching the checklist:', error);
        } finally {
            // Restore the original button content
            button.innerHTML = originalContent;
        }
    };

    /**
     * Runs the GitHub workflow for generating translations
     * @param {Event} e
     */
    const runTranslationWorkflow = async (e) => {
        e.preventDefault();

        // Get the button element
        const button = e.target;

        // Save the original content of the button
        const originalContent = button.innerHTML;

        // Replace the button content with a loader and disable it
        button.innerHTML = '<div class="loader" />';
        button.disabled = true;

        // Find the comment element and get it's ID from the permalink anchor
        const commentElement = button.closest('.timeline-comment');
        const permalinkElement = commentElement.querySelector('.js-timestamp[id*="issuecomment-"]');
        const permalinkId = permalinkElement ? permalinkElement.id : null; // Format: "issuecomment-{id}-permalink"
        const commentId = permalinkId ? permalinkId.replace('issuecomment-', '').replace('-permalink', '') : null;

        try {
            // Record the time before triggering the workflow
            const triggerTime = new Date();

            // Trigger the workflow
            await API.triggerWorkflow('generateTranslations.yml');

            // Poll for the workflow run until we find one that started after our trigger time
            let latestRun = null;
            const maxRetries = 20; // Try for up to ~40 seconds
            let retries = 0;

            // eslint-disable-next-line no-await-in-loop
            while (!latestRun && retries < maxRetries) {
                // Wait 2 seconds between checks
                // eslint-disable-next-line no-await-in-loop
                await new Promise((resolve) => {
                    setTimeout(resolve, 2000);
                });

                // Get recent workflow runs
                // eslint-disable-next-line no-await-in-loop
                const workflowRuns = await API.getWorkflowRuns('generateTranslations.yml', 5);
                const runs = workflowRuns.data.workflow_runs;

                // Find a run that started after our trigger time and is queued or in progress
                const matchingRun = _.find(runs, (run) => {
                    const runStartTime = new Date(run.created_at);
                    const isAfterTrigger = runStartTime >= triggerTime;
                    const isRunning = run.status === 'queued' || run.status === 'in_progress';
                    return isAfterTrigger && isRunning;
                });

                if (matchingRun) {
                    latestRun = matchingRun;
                } else {
                    retries++;
                }
            }

            if (latestRun && commentId) {
                const workflowUrl = latestRun.html_url;
                const runId = latestRun.id;

                // Create a status element to show below the button
                const statusElement = document.createElement('span');
                statusElement.className = 'k2-translation-status ml-2';
                statusElement.innerHTML = `<a href="${workflowUrl}" target="_blank" class="Link--primary">🦜 Polyglot Parrot is thinking... 🦜</a>`;
                button.parentNode.insertBefore(statusElement, button.nextSibling);

                // Poll the workflow status every 5 seconds
                const pollWorkflow = async () => {
                    try {
                        const runStatus = await API.getWorkflowRun(runId);
                        const {status, conclusion} = runStatus.data;

                        // Check if workflow is complete
                        if (status === 'completed') {
                            // Remove the status element
                            if (statusElement.parentNode) {
                                statusElement.parentNode.removeChild(statusElement);
                            }

                            // Show a brief success/failure indicator
                            if (conclusion === 'success') {
                                button.innerHTML = '✓ Done';
                                button.classList.add('k2-translation-success');
                                setTimeout(() => {
                                    button.innerHTML = originalContent;
                                    button.classList.remove('k2-translation-success');
                                    button.disabled = false;
                                }, 4000);
                            } else {
                                button.innerHTML = '✗ Failed';
                                button.classList.add('k2-translation-failed');
                                setTimeout(() => {
                                    button.innerHTML = originalContent;
                                    button.classList.remove('k2-translation-failed');
                                    button.disabled = false;
                                }, 4000);
                            }
                        } else {
                            // Continue polling
                            setTimeout(pollWorkflow, 5000);
                        }
                    } catch (pollError) {
                        console.error('Error polling workflow status:', pollError);

                        // Remove status element and restore button on error
                        if (statusElement.parentNode) {
                            statusElement.parentNode.removeChild(statusElement);
                        }
                        button.innerHTML = originalContent;
                        button.disabled = false;
                    }
                };

                // Start polling
                pollWorkflow();
            } else {
                // If we couldn't find the workflow run or comment, just restore the button
                button.innerHTML = originalContent;
                button.disabled = false;
            }
        } catch (error) {
            console.error('Error triggering translation workflow:', error);

            // Restore the original button content on error
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    };

    /**
     * A unique identifier for each page
     */
    Page.id = '';

    /**
     * A string to match the last part of the URL path to
     * determine if this is a webpage that the extension works on
     */
    Page.urlPath = '';

    Page.init = function () {
        // The home page is a special case because the pathname will be empty
        if (this.urlPath === ''
            && (window.location.pathname === '' || window.location.pathname === '/')) {
            return this.setup();
        }

        if (this.urlPath === '' && window.location.pathname !== '') {
            return;
        }

        // Check if the page currently open matches the URL path defined for this page class
        const regex = new RegExp(this.urlPath);
        if (!regex.test(window.location.pathname)) {
            return;
        }

        this.setup();
    };

    /**
     * This is the method that is ran after a page has matched the URL.
     * All the magic should start here.
     *
     * This should be extended for each page type.
     */
    Page.setup = function () {};

    Page.getRepoOwner = function () {
        return document.querySelectorAll('.AppHeader-context-item-label.Truncate-text')[0] // Org name next to GitHub logo
            .textContent.trim();
    };

    Page.getRepo = function () {
        return document.querySelectorAll('.AppHeader-context-item-label.Truncate-text')[1] // Repo name next to GitHub logo
            .textContent.trim();
    };

    /**
     * Renders buttons for copying checklists in issue/PR bodies
     * @param {'bugzero' | 'reviewer'} checklistType Type of target checklist
     */
    Page.renderCopyChecklistButtons = function (checklistType) {
        // Look through all the comments on the page to find one that has the template for the copy/paste checklist button
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        $('.markdown-body > p').each((i, el) => {
            const commentHtml = $(el).html();

            // When the button template is found, replace it with an HTML button and then put that back into the DOM so someone can click on it
            // Check for checklist-specific content (BUGZERO_CHECKLIST.md or REVIEWER_CHECKLIST.md)
            const isChecklistComment = commentHtml
                && commentHtml.indexOf('you can simply click: [this button]') > -1
                && (commentHtml.indexOf('BUGZERO_CHECKLIST.md') > -1
                || commentHtml.indexOf('REVIEWER_CHECKLIST.md') > -1);

            if (isChecklistComment) {
                const newHtml = commentHtml.replace('[this button]', '<button type="button" class="btn btn-sm k2-copy-checklist">HERE</button>');
                $(el).html(newHtml);

                // Now that the button is on the page, add a click handler to it (always remove all handlers first so that we know there will always be one handler attached)
                $('.k2-copy-checklist').off().on('click', e => copyReviewerChecklist(e, checklistType));
            }
        });
    };

    /**
     * Renders buttons for triggering the translation workflow
     */
    Page.renderTranslationWorkflowButtons = function () {
        // Look through all the comments on the page to find ones that have the generateTranslations.yml link
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        $('.markdown-body').each((i, commentBody) => {
            const fullCommentHTML = $(commentBody).html();

            // Check if this comment is about translations by looking for the workflow link
            // AND that we haven't already replaced the button (to avoid refresh loops)
            if (fullCommentHTML && fullCommentHTML.includes('generateTranslations.yml') && fullCommentHTML.includes('[this button]')) {
                // Now find `[this button]` and replace it with our button
                const updatedFullCommentHTML = fullCommentHTML.replace('[this button]', '<button type="button" class="btn btn-sm k2-translation-workflow">HERE</button>');
                $(commentBody).html(updatedFullCommentHTML);

                // Now that the button is on the page, add a click handler to it
                $('.k2-translation-workflow').off().on('click', runTranslationWorkflow);
            }
        });
    };

    /**
     * Applies timestamp format based on user preference
     * Sets up Onyx connection to listen for preference changes and returns a function
     * that can be called periodically to handle dynamically loaded timestamps
     * @returns {Function} Function to call periodically for dynamic content
     */
    Page.applyTimestampFormat = function () {
        let currentPreference = false;

        // eslint-disable-next-line no-console
        console.log('[K2 Timestamp Converter] Setting up timestamp format converter');

        // Connect to Onyx to listen for preference changes
        ReactNativeOnyx.connect({
            key: ONYXKEYS.PREFERENCES,
            callback: (preferences) => {
                // eslint-disable-next-line no-console
                console.log('[K2 Timestamp Converter] Onyx callback fired:', preferences);
                if (!preferences) {
                    return;
                }
                currentPreference = preferences.useStaticTimestamps || false;
                // eslint-disable-next-line no-console
                console.log('[K2 Timestamp Converter] Preference changed to:', currentPreference);
                convertTimestamps(currentPreference);
            },
        });

        // Also try to get initial preference
        const initialPreference = Preferences.getUseStaticTimestamps();
        // eslint-disable-next-line no-console
        console.log('[K2 Timestamp Converter] Initial preference:', initialPreference);
        if (initialPreference !== undefined) {
            currentPreference = initialPreference;
            convertTimestamps(currentPreference);
        }

        // Return a function that can be called periodically
        // This function reads the current preference and converts timestamps
        return function applyTimestampFormatPeriodic() {
            const useStaticTimestamps = Preferences.getUseStaticTimestamps();
            convertTimestamps(useStaticTimestamps);
        };
    };

    return Page;
}
