import ReactNativeOnyx from 'react-native-onyx';
import moment from 'moment';
import _ from 'underscore';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';

function getDailyImprovements() {
    API.getDailyImprovements()
        .then((issues) => {
            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.ISSUES.DAILY_IMPROVEMENTS, issues);
        });
}

function getAllAssigned() {
    API.getIssuesAssigned()
        .then((issues) => {
            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.ISSUES.ASSIGNED, issues);
        });
}

function getEngineering() {
    API.getEngineeringIssues().then((issues) => {
        // Set the type of the item to be the label we are looking for
        const sortedData = _.chain(issues)
            .map((item) => {
                const modifiedItem = {...item};
                modifiedItem.type = 'engineering';

                const age = moment().diff(item.created_at, 'days');
                const isImprovement = _.findWhere(item.labels, {name: 'Improvement'});
                const isTask = _.findWhere(item.labels, {name: 'Task'});
                const isFeature = _.findWhere(item.labels, {name: 'NewFeature'});
                const isHourly = _.findWhere(item.labels, {name: 'Hourly'});
                const isDaily = _.findWhere(item.labels, {name: 'Daily'});
                const isWeekly = _.findWhere(item.labels, {name: 'Weekly'});
                const isMonthly = _.findWhere(item.labels, {name: 'Monthly'});
                const isFirstPick = _.findWhere(item.labels, {name: 'FirstPick'});
                const isWhatsNext = _.findWhere(item.labels, {name: 'WhatsNext'});
                let score = 0;

                // Sort by K2
                score += isHourly ? 10000000 : 0;
                score += isDaily ? 1000000 : 0;
                score += isWeekly ? 100000 : 0;
                score += isMonthly ? 10000 : 0;

                // WhatsNext issues should be at the top of each KSV2 group
                score += isWhatsNext ? 9000 : 0;

                // First picks go above improvements
                score += isFirstPick ? 1050 : 0;

                // All improvements are at the top, followed by tasks, followed by features
                score += isImprovement ? 1000 : 0;
                score += isTask ? 500 : 0;
                score += isFeature ? 500 : 0;

                // Sort by age too
                score += age / 100;

                modifiedItem.score = score;
                modifiedItem.age = age;
                return modifiedItem;
            })
            .sortBy('score')
            .value();

        // Always use set() here because there is no way to remove issues from Onyx
        // that have the engineering label removed
        ReactNativeOnyx.set(ONYXKEYS.ISSUES.ENGINEERING, _.indexBy(sortedData.reverse(), 'id'));
    });
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

export {
    addComment,
    getAllAssigned,
    getEngineering,
    getDailyImprovements,
    saveFilters,
};
