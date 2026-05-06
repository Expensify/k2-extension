import _ from 'underscore';
import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';
import ActionThrottle from '../ActionThrottle';

/**
 * Extract check conclusion from the GraphQL statusCheckRollup state.
 * Maps GitHub's StatusState enum to our conclusion format.
 *
 * @param {Object} pr - Pull request object from GraphQL response
 * @returns {String} - 'success', 'failure', 'pending', or 'unknown'
 */
function getCheckConclusionFromGraphQL(pr) {
    const commits = pr.commits && pr.commits.nodes;
    if (!commits || commits.length === 0) {
        return 'unknown';
    }

    const statusCheckRollup = commits[0] && commits[0].commit && commits[0].commit.statusCheckRollup;
    if (!statusCheckRollup) {
        return 'unknown';
    }

    // GitHub StatusState enum values: EXPECTED, ERROR, FAILURE, PENDING, SUCCESS
    const state = statusCheckRollup.state;
    switch (state) {
        case 'SUCCESS':
            return 'success';
        case 'FAILURE':
        case 'ERROR':
            return 'failure';
        case 'PENDING':
        case 'EXPECTED':
            return 'pending';
        default:
            return 'unknown';
    }
}

/**
 * Process PRs to add checkConclusion from GraphQL data (no extra API calls needed).
 * This replaces the old getChecks() function which made N separate REST API calls.
 *
 * @param {Object} prs - Object of PRs indexed by ID
 * @returns {Object} - Same PRs with checkConclusion added
 */
function addCheckConclusionsToPRs(prs) {
    return _.mapObject(prs, pr => ({
        ...pr,
        checkConclusion: getCheckConclusionFromGraphQL(pr),
    }));
}

function getAssigned() {
    ActionThrottle('getAssigned', () => API.getPullsByType('assignee').then(prs => API.getPullsByType('author').then((authorPrs) => {
        _.each(authorPrs, (authorPr) => {
            if (authorPr.assignees.nodes.length > 0) {
                return;
            }

            // eslint-disable-next-line no-param-reassign
            prs[authorPr.id] = authorPr;
        });

        // Add check conclusions from GraphQL data (no extra API calls needed)
        const prsWithChecks = addCheckConclusionsToPRs(prs);

        // Always use set() here because there is no way to remove issues from Onyx
        // that get closed and are no longer assigned
        ReactNativeOnyx.set(ONYXKEYS.PRS.ASSIGNED, prsWithChecks);
    })));
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

            // Add check conclusions from GraphQL data (no extra API calls needed)
            const prsWithChecks = addCheckConclusionsToPRs(
                prsAuthoredByOtherUsers,
            );

            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.PRS.REVIEWING, prsWithChecks);
        });
    });
}

export {getAssigned, getReviewing};
