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
import K2previousissues from '../../../module/K2previousissues/K2previousissues';
import ONYXKEYS from '../../../ONYXKEYS';
import * as API from '../../api';

let clearErrorTimeoutID;
function catchError(e) {
    $('div[data-component="PH_Actions"] .k2-element').remove(); // K2 elements in action buttons
    $('div[data-component="PH_Actions"]') // Action buttons next to issue title
        .append('<span class="alert k2-element">OOPS!</span>');
    console.error(e);
    clearTimeout(clearErrorTimeoutID);
    clearErrorTimeoutID = setTimeout(() => {
        $('div[data-component="PH_Actions"] .k2-element').remove();
    }, 30000);
}

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
 * @param {String | null} [issueOwner] GitHub username of the issue owner. Null means no owner, undefined means get the owner from issue body
 */
const renderAssignees = (issueOwner) => {
    // Always start by erasing whatever was drawn before (so it always starts from a clean slate)
    $('div[data-testid="sidebar-section"] .k2-element').remove();

    let currentOwner = issueOwner;

    // if issue owner is not provided, then try to get it from the issue body
    if (currentOwner === undefined) {
        const ghDescription = $('.markdown-body').first().text();
        const regexResult = ghDescription.match(/Current Issue Owner:\s@(?<owner>\S+)/i);
        currentOwner = regexResult && regexResult.groups && regexResult.groups.owner;
    }

    // Add buttons to each assignee
    $('div[data-testid="issue-assignees"]').each((i, el) => {
        const assignee = $(el).text();
        $(el).closest('li').css('display', 'flex');
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
    $('.k2-button-remove-owner').off('click').on('click', async (e) => {
        e.preventDefault();
        const owner = $(e.target).data('owner');
        removeOwner(owner);
        renderAssignees(null);
    });

    // Make a new owner when this button is clicked
    $('.k2-button-make-owner').off('click').on('click', async (e) => {
        e.preventDefault();
        const newOwner = $(e.target).data('owner');
        if (currentOwner) {
            replaceOwner(currentOwner, newOwner);
        } else {
            setOwner(newOwner);
        }
        renderAssignees(newOwner);
    });
};

const refreshPicker = function () {
    // Add our wrappers to the DOM which all the React components will be rendered into
    if ($('.k2picker-wrapper')) {
        $('div[data-testid="sidebar-projects-section"]') // Labels section in right side panel
            .before(sidebarWrapperHTML);
    }

    new K2picker().draw();
    new K2pickerType().draw();
    new K2pickerarea().draw();
    new ToggleReview().draw();
    new K2comments().draw();
    new K2previousissues().draw();
};

/**
 * This class handles the functionality on the issue page
 *
 * @returns {Object}
 */
export default function () {
    let alreadySetup = false;
    ReactNativeOnyx.init({
        keys: ONYXKEYS,
    });

    const IssuePage = new Base();

    IssuePage.urlPath = '^(/[\\w-]+/[\\w-.]+/issues/\\d+)$';

    IssuePage.setup = function () {
        // Prevent this function from running twice (it sometimes does that because of how chrome triggers the extension)
        if (alreadySetup) {
            return;
        }
        alreadySetup = true;

        // Draw them once when the page is loaded
        setTimeout(refreshPicker, 500);
        setTimeout(renderAssignees, 500);

        // Every second, check to see if the pickers are still there, and if not, redraw them
        setInterval(() => {
            if (!$('.k2picker-wrapper')) {
                refreshPicker();
            }

            if (!$('div[data-testid="issue-viewer-metadata-pane"] > :nth-child(3) .k2-element') // Assignee section in right side panel
                .length) {
                renderAssignees();
            }
        }, 1000);

        // Waiting 2 seconds to call this gives the page enough time to load so that there is a better chance that all the comments will be rendered
        setInterval(() => IssuePage.renderCopyChecklistButtons('bugzero'), 2000);
    };

    return IssuePage;
}
