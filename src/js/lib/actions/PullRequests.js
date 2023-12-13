import _ from 'underscore';
import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';
import ActionThrottle from '../ActionThrottle';

function getChecks(prs, onyxKey) {
    const checkRunPromises = _.reduce(prs, (finalPromiseArray, pr) => {
        finalPromiseArray.push(
            API.getCheckRuns(pr.repository.name, pr.headRefOid).then((response) => {
                if (!response.data.check_runs || !response.data.check_runs.length) {
                    return;
                }
                ReactNativeOnyx.merge(onyxKey, {
                    [pr.id]: {
                        checkConclusion: _.reduce(
                            response.data.check_runs,
                            (previousValue, currentValue) => {
                                const conclusion = currentValue.conclusion;

                                // If any check runs are failing, mark it failed
                                if (conclusion === 'failure' || previousValue === 'failure') {
                                    return 'failure';
                                }

                                // If the current check run is successful, mark it success. If the previous one is
                                // successful, this one could only be successful or skipped, and either way, we
                                // want to mark the whole thing as successful
                                if (conclusion === 'success' || previousValue === 'success') {
                                    return 'success';
                                }

                                // If the check is skipped, mark it skipped
                                if (conclusion === 'skipped') {
                                    return 'skipped';
                                }

                                // All possible states include: action_required, cancelled, failure, neutral,
                                // success, skipped, stale, timed_out. We may wish to consider some of these states
                                // failures, such as "cancelled". If we get here, we have reached a state we have
                                // not handled above and therefore consider "unknown." In that case, return
                                // previousValue which should be set to the seed value of 'unknown'.
                                return previousValue;
                            },
                            'unknown',
                        ),
                    },
                });
            }),
        );
        return finalPromiseArray;
    }, []);
    return Promise.all(checkRunPromises);
}

function getAssigned() {
    ActionThrottle('getAssigned', () => (
        API.getPullsByType('assignee')
            .then(prs => (
                API.getPullsByType('author')
                    .then((authorPrs) => {
                        _.each(authorPrs, (authorPr) => {
                            if (authorPr.assignees.nodes.length > 0) {
                                return;
                            }

                            // eslint-disable-next-line no-param-reassign
                            prs[authorPr.id] = authorPr;
                        });

                        // Always use set() here because there is no way to remove issues from Onyx
                        // that get closed and are no longer assigned
                        ReactNativeOnyx.set(ONYXKEYS.PRS.ASSIGNED, prs);

                        // Get the check-runs for each PR and then merge that information into the PR information in Onyx.
                        return getChecks(prs, ONYXKEYS.PRS.ASSIGNED);
                    })
            ))
    ));
}

function getReviewing() {
    ActionThrottle('getReviewing', () => {
        const promises = [];
        promises.push(API.getPullsByType('review-requested'));
        promises.push(API.getPullsByType('reviewed-by'));

        return Promise.all(promises).then((values) => {
            const allPRs = {
                ...values[0],
                ...values[1],
            };

            const prsAuthoredByOtherUsers = _.chain(allPRs)
                .reject(pr => pr.author.login === API.getCurrentUser())
                .indexBy('id')
                .value();

            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.PRS.REVIEWING, prsAuthoredByOtherUsers);

            // Get the check-runs for each PR and then merge that information into the PR information in Onyx.
            return getChecks(prsAuthoredByOtherUsers, ONYXKEYS.PRS.REVIEWING);
        });
    });
}

export {
    getAssigned,
    getReviewing,
};
