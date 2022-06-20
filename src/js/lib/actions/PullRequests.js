import _ from 'underscore';
import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';

function getChecks(prs) {
    _.each(prs, (pr) => {
        API.getCheckRuns(pr.repository.name, pr.headRefOid).then((response) => {
            if (!response.check_runs || !response.check_runs.length) {
                return;
            }
            ReactNativeOnyx.merge(ONYXKEYS.PRS.REVIEWING, {
                [pr.id]: {
                    checkConclusion: response.check_runs[0].conclusion,
                },
            });
        });
    })
}

function getAssigned() {
    API.getPullsByType('assignee')
        .then((prs) => {
            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.PRS.ASSIGNED, prs);
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

        // Always use set() here because there is no way to remove issues from Onyx
        // that get closed and are no longer assigned
        ReactNativeOnyx.set(ONYXKEYS.PRS.REVIEWING, allPRs);

        // Get the check-runs for each PR and then merge that information into the PR information in Onyx.
        getChecks(allPRs)
    });
}

export {
    getAssigned,
    getReviewing,
};
