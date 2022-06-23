import _ from 'underscore';
import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';

function getChecks(prs, onyxKey) {
    _.each(prs, (pr) => {
        API.getCheckRuns(pr.repository.name, pr.headRefOid).then((response) => {
            if (!response.data.check_runs || !response.data.check_runs.length) {
                return;
            }
            ReactNativeOnyx.merge(onyxKey, {
                [pr.id]: {
                    checkConclusion: response.data.check_runs[0].conclusion,
                },
            });
        });
    });
}

function getAssigned() {
    API.getPullsByType('assignee')
        .then((prs) => {
            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.PRS.ASSIGNED, prs);

            // Get the check-runs for each PR and then merge that information into the PR information in Onyx.
            getChecks(prs, ONYXKEYS.PRS.ASSIGNED);
        });
}

function getReviewing() {
    const promises = [];
    promises.push(API.getPullsByType('review-requested'));
    promises.push(API.getPullsByType('reviewed-by'));

    Promise.all(promises).then((values) => {
        const allPRs = {
            ...values[0],
            ...values[1],
        };

        const prsAuthoredByOtherUsers = _.chain(allPRs)
            .reject((pr) => {
                return pr.author.login === API.getCurrentUser();
            })
            .indexBy('id')
            .value();

        // Always use set() here because there is no way to remove issues from Onyx
        // that get closed and are no longer assigned
        ReactNativeOnyx.set(ONYXKEYS.PRS.REVIEWING, prsAuthoredByOtherUsers);

        // // Get the check-runs for each PR and then merge that information into the PR information in Onyx.
        getChecks(prsAuthoredByOtherUsers, ONYXKEYS.PRS.REVIEWING);
    });
}

export {
    getAssigned,
    getReviewing,
};
