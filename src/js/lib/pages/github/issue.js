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

function renderLinksInTitle() {
    const titleSelector = $('div[data-testid="issue-header"] bdi');

    if (!titleSelector.length) {
        return;
    }

    const titleText = titleSelector.text();
    const pattern = /\[HOLD.*?([A-Za-z0-9_.-]*)#(\d+)\]/i;
    const match = titleText.match(pattern);

    if (!match) {
        return;
    }
    let partialRepoName = match[1];
    const issueOrPRNumber = match[2];
    const pathParts = window.location.pathname.split('/');
    const orgName = pathParts[1];
    const currentRepoName = pathParts[2];
    if (partialRepoName === 'Web') {
        partialRepoName = 'Web-Expensify';
    }
    let link;
    if (!partialRepoName) {
        link = `https://github.com/${orgName}/${currentRepoName}/issues/${issueOrPRNumber}`;
    } else {
        link = `https://github.com/${orgName}/${partialRepoName}/pull/${issueOrPRNumber}`;
    }
    const needle = `${match[1]}#${issueOrPRNumber}`;
    const replacement = `<a href="${link}" target="_blank">#${issueOrPRNumber}</a>`;
    const replacedTitle = titleText.replace(needle, replacement);
    titleSelector.html(replacedTitle);
}

/**
 * Sets the owner of an issue when it doesn't have an owner yet
 * @param {String} newOwner to change to (removes owner if null)
 * @param {String} oldOwner to change from (only adds new owner if null)
 */
async function setOwner(newOwner, oldOwner) {
    const actionedOwner = newOwner ?? oldOwner;
    const ownerSelector = $(`button[data-owner="${actionedOwner}"]`);
    $(ownerSelector).html('<div class="loader" />');

    try {
        const issueDescription = (await API.getCurrentIssueDescription()).data.body;
        let newDescription;

        if (newOwner) {
            if (oldOwner) {
                newDescription = issueDescription.replace(`Current Issue Owner: @${oldOwner}`, `Current Issue Owner: @${newOwner}`);
            } else {
                newDescription = `${issueDescription}\n\n<details><summary>Issue Owner</summary>Current Issue Owner: @${newOwner}</details>`;
            }
        } else {
            newDescription = issueDescription.replace(`<details><summary>Issue Owner</summary>Current Issue Owner: @${oldOwner}</details>`, '');
        }

        await API.setCurrentIssueBody(newDescription);
    } catch (e) {
        catchError(e);
    }
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
        await setOwner(null, owner);
        renderAssignees(null);
    });

    // Make a new owner when this button is clicked
    $('.k2-button-make-owner').off('click').on('click', async (e) => {
        e.preventDefault();
        const newOwner = $(e.target).data('owner');
        if (currentOwner) {
            await setOwner(newOwner, currentOwner);
        } else {
            await setOwner(newOwner, null);
        }
        renderAssignees(newOwner);
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
            if (!$('.k2picker-wrapper').length) {
                refreshPicker();
            }
            if (!$('div[data-testid="issue-viewer-metadata-pane"] > :nth-child(2) .k2-element').length) {
                renderAssignees();
            }
        }, 1000);

        renderLinksInTitle();
        // Waiting 2 seconds to call this gives the page enough time to load so that there is a better chance that all the comments will be rendered
        setInterval(() => IssuePage.renderCopyChecklistButtons('bugzero'), 2000);
    };

    return IssuePage;
}
