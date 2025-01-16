import $ from 'jquery';
import * as API from '../../api';

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

            if (!response.ok) {
                console.error(`Failed to load contents of ${checklistUrl}: ${response.statusText}`);
                return;
            }

            const fileContents = await response.text();

            if (!fileContents) {
                console.error(`Could not load contents of ${checklistUrl} for some reason`);
                return;
            }

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
        return document.querySelectorAll('.AppHeader-context-item-label.Truncate-text')[0].textContent.trim();
    };

    Page.getRepo = function () {
        return document.querySelectorAll('.AppHeader-context-item-label.Truncate-text')[1].textContent.trim();
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
            if (commentHtml && commentHtml.indexOf('you can simply click: [this button]') > -1) {
                const newHtml = commentHtml.replace('[this button]', '<button type="button" class="btn btn-sm k2-copy-checklist">HERE</button>');
                $(el).html(newHtml);

                // Now that the button is on the page, add a click handler to it (always remove all handlers first so that we know there will always be one handler attached)
                $('.k2-copy-checklist').off().on('click', e => copyReviewerChecklist(e, checklistType));
            }
        });
    };

    return Page;
}
