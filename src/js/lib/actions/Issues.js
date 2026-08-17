import ReactNativeOnyx from 'react-native-onyx';
import _ from 'underscore';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';
import ActionThrottle from '../ActionThrottle';
import scoreIssue from '../issueImpactScore';

function getHotPicks() {
    ActionThrottle('getHotPicks', () => API.getHotPickIssues().then((issues) => {
        const sortedData = _.chain(issues)
            .sortBy(scoreIssue)
            .value()
            .reverse();

        // Always use set() here because there is no way to remove issues from Onyx
        // that get closed or assigned
        ReactNativeOnyx.set(ONYXKEYS.ISSUES.HOTPICKS, sortedData);
    }));
}

function getDailyImprovements() {
    ActionThrottle('getDailyImprovements', () => API.getDailyImprovements().then((issues) => {
        // Always use set() here because there is no way to remove issues from Onyx
        // that get closed and are no longer assigned
        ReactNativeOnyx.set(ONYXKEYS.ISSUES.DAILY_IMPROVEMENTS, issues);
    }));
}

function getNeedsReply() {
    ActionThrottle('getNeedsReply', () => API.getIssuesMentioning().then((issues) => {
        // Always use set() here because there is no way to remove issues from Onyx
        // that get closed or assigned
        ReactNativeOnyx.set(ONYXKEYS.ISSUES.NEEDS_REPLY, issues);
    }));
}

function getAllAssigned() {
    ActionThrottle('getAllAssigned', () => API.getIssuesAssigned().then((issues) => {
        const currentUser = API.getCurrentUser();
        const issuesMarkedWithOwner = _.reduce(
            issues,
            (finalObject, issue) => {
                const regexResult = issue.body.match(
                    /Current Issue Owner:\s@(?<owner>[a-z0-9-]+)/i,
                );
                const parsedOwner = regexResult
                        && regexResult.groups
                        && regexResult.groups.owner;

                // An owner only counts if they are also an assignee, matching the overdue issue meeting logic.
                // This keeps a stale owner (still in the body but no longer assigned) from counting as the owner.
                const assigneeLogins = _.pluck(issue.assignees, 'login');
                const currentOwner = parsedOwner && _.contains(assigneeLogins, parsedOwner)
                    ? parsedOwner
                    : null;

                const result = finalObject;

                result[issue.id] = {
                    ...issue,
                    issueHasOwner: !!currentOwner,
                    currentUserIsOwner:
                            currentOwner && currentOwner === currentUser,
                };

                return result;
            },
            {},
        );

        // Always use set() here because there is no way to remove issues from Onyx
        // that get closed and are no longer assigned
        ReactNativeOnyx.set(
            ONYXKEYS.ISSUES.ASSIGNED,
            issuesMarkedWithOwner,
        );
    }));
}

function getEngineering() {
    ActionThrottle('getEngineering', () => API.getEngineeringIssues().then((issues) => {
        // Set the type of the item to be the label we are looking for
        const sortedData = _.chain(issues)
            .map(item => ({...item, type: 'engineering'}))
            .sortBy(scoreIssue)
            .value();

        // Always use set() here because there is no way to remove issues from Onyx
        // that have the engineering label removed
        ReactNativeOnyx.set(
            ONYXKEYS.ISSUES.ENGINEERING,
            _.indexBy(sortedData.reverse(), 'id'),
        );
    }));
}

/**
 * @param {Object} checkboxes
 * @param {String} [checkboxes.shouldHideOnHold]
 * @param {String} [checkboxes.shouldHideUnderReview]
 * @param {String} [checkboxes.shouldHideOwnedBySomeoneElse]
 * @param {String} [checkboxes.shouldHideNotOverdue]
 */
function saveCheckboxes(checkboxes) {
    ReactNativeOnyx.merge(ONYXKEYS.ISSUES.CHECKBOXES, checkboxes);
}

/**
 * @param {Object} filters
 * @param {String} filters.milestone
 * @param {String} filters.improvement
 * @param {String} filters.task
 * @param {String} filters.feature
 */
function saveFilters(filters) {
    ReactNativeOnyx.merge(ONYXKEYS.ISSUES.FILTER, filters);
}

/**
 * @param {String} comment
 */
function addComment(comment) {
    API.addComment(comment);
}

function setPriorities(priorities, priorityLabel) {
    ReactNativeOnyx.set(
        `${ONYXKEYS.ISSUES.COLLECTION_PRIORITIES}${priorityLabel}`,
        priorities,
    );
}

export {
    addComment,
    getAllAssigned,
    getEngineering,
    getDailyImprovements,
    getHotPicks,
    saveCheckboxes,
    saveFilters,
    setPriorities,
    getNeedsReply,
};
