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
    $('.gh-header-actions .k2-element').remove();
    $('.gh-header-actions').append('<span class="alert k2-element">OOPS!</span>');
    console.error(e);
    clearTimeout(clearErrorTimeoutID);
    clearErrorTimeoutID = setTimeout(() => {
        $('.gh-header-actions .k2-element').remove();
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
 */
const refreshAssignees = () => {
    // Always start by erasing whatever was drawn before (so it always starts from a clean slate)
    $('.js-issue-assignees .k2-element').remove();

    // Do nothing if there is only one person assigned. Owners can only be set when there are
    // multiple assignees
    if ($('.js-issue-assignees > p > span').length <= 1) {
        return;
    }

    // Check if there is an owner for the issue
    const ghDescription = $('.comment-body').text();
    const regexResult = ghDescription.match(/Current Issue Owner:\s@(?<owner>\S+)/i);
    const currentOwner = regexResult && regexResult.groups && regexResult.groups.owner;

    // Add buttons to each assignee
    $('.js-issue-assignees > p > span').each((i, el) => {
        const assignee = $(el).find('.assignee span').text();
        if (assignee === currentOwner) {
            $(el).append(`
                <button type="button" class="Button flex-md-order-2 m-0 owner k2-element k2-button k2-button-remove-owner" data-owner="${currentOwner}">
                    ★
                </button>
            `);
        } else {
            $(el).append(`
                <button type="button" class="Button flex-md-order-2 m-0 k2-element k2-button k2-button-make-owner" data-owner="${assignee}">
                    ○
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
        $('.js-issue-labels').after(sidebarWrapperHTML);
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

        let refreshPickerTimeoutID;
        let refreshAssigneesTimeoutID;
        setTimeout(refreshPicker, 500);
        setTimeout(refreshAssignees, 500);

        // Listen for when the sidebar is redrawn, then redraw our pickers
        $(document).bind('DOMNodeRemoved', (e) => {
            if ($(e.target).hasClass('sidebar-assignee')) {
                // Make sure that only one setTimeout runs at a time
                clearTimeout(refreshAssigneesTimeoutID);
                refreshAssigneesTimeoutID = setTimeout(refreshAssignees, 500);
            }

            if ($(e.target).is('#partial-discussion-sidebar')) {
                // Make sure that only one setTimeout runs at a time
                clearTimeout(refreshPickerTimeoutID);
                refreshPickerTimeoutID = setTimeout(refreshPicker, 500);
                clearTimeout(refreshAssigneesTimeoutID);
                refreshAssigneesTimeoutID = setTimeout(refreshAssignees, 500);
            }
        });
    };

    return IssuePage;
}
