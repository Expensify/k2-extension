/* eslint-disable rulesdir/prefer-underscore-method */
import $ from 'jquery';
import ReactNativeOnyx from 'react-native-onyx';
import Base from './_base';
import sidebarWrapperHTML from '../../../template/sidebar.wrappers.html';
import K2picker from '../../../module/K2picker/K2picker';
import K2pickerarea from '../../../module/K2pickerarea/K2pickerarea';
import K2pickerType from '../../../module/K2pickertype/K2pickertype';
import ToggleReview from '../../../module/ToggleReview/ToggleReview';
import K2comments from '../../../module/K2comments/K2comments';
import ONYXKEYS from '../../../ONYXKEYS';
import * as API from '../../api';

let clearErrorTimeoutID;
function catchError(e) {
    $('div[data-component="PH_Actions"] .k2-element').remove();
    $('div[data-component="PH_Actions"]').append('<span class="alert k2-element">OOPS!</span>');
    console.error(e);
    clearTimeout(clearErrorTimeoutID);
    clearErrorTimeoutID = setTimeout(() => {
        $('div[data-component="PH_Actions"] .k2-element').remove();
    }, 30000);
}

/**
 * Gets the contents of the reviewer checklist from GitHub and then posts it as a comment to the current PR
 * @param {Event} e
 */
const copyReviewerChecklist = (e) => {
    e.preventDefault();
    const pathToChecklist = 'https://raw.githubusercontent.com/Expensify/App/main/contributingGuides/BUGZERO_CHECKLIST.md';
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

/**
 * Sets the owner of an issue when it doesn't have an owner yet
 * @param {String} owner to set
 */
function setOwner(owner) {
    API.getCurrentIssueDescription()
        .then((response) => {
            const ghDescription = response.data.body;
            const newDescription = `${ghDescription}

<details><summary>Issue Owner</summary>Current Issue Owner: @${owner}</details>`;
            API.setCurrentIssueBody(newDescription);
        })
        .catch(catchError);
}

/**
 * Removes the existing owner of an issue
 * @param {String} owner to remove
 */
function removeOwner(owner) {
    API.getCurrentIssueDescription()
        .then((response) => {
            const ghDescription = response.data.body;
            const newDescription = ghDescription.replace(`<details><summary>Issue Owner</summary>Current Issue Owner: @${owner}</details>`, '');
            API.setCurrentIssueBody(newDescription);
        })
        .catch(catchError);
}

/**
 * Replaces the existing issue owner with a different owner
 * @param {String} oldOwner
 * @param {String} newOwner
 */
function replaceOwner(oldOwner, newOwner) {
    API.getCurrentIssueDescription()
        .then((response) => {
            const ghDescription = response.data.body;
            const newDescription = ghDescription.replace(`Current Issue Owner: @${oldOwner}`, `Current Issue Owner: @${newOwner}`);
            API.setCurrentIssueBody(newDescription);
        })
        .catch(catchError);
}

/**
 * This method is all about adding the "issue owner" functionality which melvin will use to see who should be providing ksv2 updates to an issue.
 */
const refreshAssignees = () => {
    // Always start by erasing whatever was drawn before (so it always starts from a clean slate)
    $('div[data-testid="sidebar-section"] > .k2-element').remove();

    // Check if there is an owner for the issue
    const ghDescription = $('.markdown-body').first().text();
    const regexResult = ghDescription.match(/Current Issue Owner:\s@(?<owner>\S+)/i);
    const currentOwner = regexResult && regexResult.groups && regexResult.groups.owner;

    // Add buttons to each assignee
    $('div[data-testid="issue-assignees"]').each((i, el) => {
        const assignee = $(el).text();
        if (assignee === currentOwner) {
            $(el).closest('li').append(`
                <button type="button" class="Button flex-md-order-2 m-0 owner k2-element k2-button k2-button-remove-owner" data-owner="${currentOwner}">
                    ★
                </button>
            `);
        } else {
            $(el).closest('li').append(`
                <button type="button" class="Button flex-md-order-2 m-0 k2-element k2-button k2-button-make-owner" data-owner="${assignee}">
                    ☆
                </button>
            `);
        }
    });

    // Remove the owner with this button is clicked
    $('.k2-button-remove-owner').off('click').on('click', (e) => {
        e.preventDefault();
        const owner = $(e.target).data('owner');
        removeOwner(owner);
        return false;
    });

    // Make a new owner when this button is clicked
    $('.k2-button-make-owner').off('click').on('click', (e) => {
        e.preventDefault();
        const newOwner = $(e.target).data('owner');
        if (currentOwner) {
            replaceOwner(currentOwner, newOwner);
        } else {
            setOwner(newOwner);
        }
        return false;
    });
};

const refreshPicker = function () {
    // Add our wrappers to the DOM which all the React components will be rendered into
    if (!$('.k2picker-wrapper').length) {
        $('div[data-testid="issue-viewer-metadata-pane"] > :nth-child(3)').after(sidebarWrapperHTML);
    }

    new K2picker().draw();
    new K2pickerType().draw();
    new K2pickerarea().draw();
    new ToggleReview().draw();
    new K2comments().draw();
};

/**
 * This class handles the functionality on the issue page
 *
 * @returns {Object}
 */
export default function () {
    let allreadySetup = false;
    ReactNativeOnyx.init({
        keys: ONYXKEYS,
    });

    const IssuePage = new Base();

    IssuePage.urlPath = '^(/[\\w-]+/[\\w-.]+/issues/\\d+)$';

    IssuePage.setup = function () {
        // Prevent this function from running twice (it sometimes does that because of how chrome triggers the extension)
        if (allreadySetup) {
            return;
        }
        allreadySetup = true;

        // Draw them once when the page is loaded
        setTimeout(refreshPicker, 500);
        setTimeout(refreshAssignees, 500);

        // Every second, check to see if the pickers are still there, and if not, redraw them
        setInterval(() => {
            if (!$('.k2picker-wrapper').length) {
                refreshPicker();
            }
            if (!$('div[data-testid="issue-viewer-metadata-pane"] > :nth-child(2) .k2-element').length) {
                refreshAssignees();
            }
        }, 1000);

        // Waiting 2 seconds to call this gives the page enough time to load so that there is a better chance that all the comments will be rendered
        setInterval(renderCopyChecklistButton, 2000);
    };

    return IssuePage;
}
