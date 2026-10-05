import _ from 'underscore';
import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';
import CONST from '../../CONST';
import ActionThrottle from '../ActionThrottle';
import getPullRequestIssueURLs from '../getPullRequestIssueURLs';

/**
 * Resolve each issue once, even when several PRs address it.
 *
 * @param {Object} prs
 * @returns {Promise<Object>}
 */
function getLinkedIssues(prs) {
    const issueURLsByPR = _.mapObject(prs, getPullRequestIssueURLs);
    const issuesByURL = {};
    _.each(prs, (pr) => {
        _.each(pr.closingIssuesReferences && pr.closingIssuesReferences.nodes, (issue) => {
            issuesByURL[issue.url.toLowerCase()] = issue;
        });
    });

    const issueURLs = _.uniq(_.flatten(_.values(issueURLsByPR)));
    return Promise.all(_.map(issueURLs, (url) => {
        if (issuesByURL[url]) {
            return Promise.resolve();
        }

        return API.getIssueByURL(url)
            .catch(() => {
                // Keep the issue link usable when its title is unavailable, including for private issues.
                const [, owner, repo, , number] = new URL(url).pathname.split('/');
                return {url, title: `${owner}/${repo} #${number}`};
            })
            .then((issue) => {
                issuesByURL[url] = issue;
            });
    })).then(() => _.mapObject(prs, pr => ({
        ...pr,
        linkedIssues: _.map(issueURLsByPR[pr.id], url => issuesByURL[url]),
    })));
}

const refreshGenerations = {};
const maxConcurrentCheckRequests = 5;

function beginRefresh(onyxKey) {
    refreshGenerations[onyxKey] = (refreshGenerations[onyxKey] || 0) + 1;
    return refreshGenerations[onyxKey];
}

function isCurrentRefresh(onyxKey, generation) {
    return refreshGenerations[onyxKey] === generation;
}

function getCheckConclusion(checkRuns) {
    return _.reduce(checkRuns, (previousValue, currentValue) => {
        if (_.contains(CONST.IGNORED_CHECK_RUN_NAMES, currentValue.name)) {
            return previousValue;
        }
        if (currentValue.conclusion === 'failure' || previousValue === 'failure') {
            return 'failure';
        }
        if (currentValue.status !== 'completed' || previousValue === 'pending') {
            return 'pending';
        }
        if (currentValue.conclusion === 'success' || previousValue === 'success') {
            return 'success';
        }
        if (currentValue.conclusion === 'skipped') {
            return 'skipped';
        }
        return previousValue;
    }, 'unknown');
}

function getCheck(pr) {
    return API.getCheckRuns(pr.repository.name, pr.headRefOid).then((response) => {
        const checkRuns = response.data.check_runs;
        if (!checkRuns || !checkRuns.length) {
            return null;
        }
        return {
            id: pr.id,
            checkConclusion: getCheckConclusion(checkRuns),
        };
    });
}

function getChecks(prs, shouldContinue) {
    const allPRs = _.values(prs);
    const checks = {};

    function fetchBatch(startIndex) {
        if (!shouldContinue() || startIndex >= allPRs.length) {
            return Promise.resolve(checks);
        }
        const batch = allPRs.slice(startIndex, startIndex + maxConcurrentCheckRequests);
        return Promise.allSettled(_.map(batch, getCheck)).then((results) => {
            _.each(results, (result) => {
                if (result.status !== 'fulfilled' || !result.value) {
                    return;
                }
                checks[result.value.id] = {checkConclusion: result.value.checkConclusion};
            });
            return fetchBatch(startIndex + maxConcurrentCheckRequests);
        });
    }

    return fetchBatch(0);
}

function getAssigned() {
    return ActionThrottle('getAssigned', async () => {
        const onyxKey = ONYXKEYS.PRS.ASSIGNED;
        const generation = beginRefresh(onyxKey);
        const prs = await API.getPullsByType('assignee');
        const authorPrs = await API.getPullsByType('author');

        _.each(authorPrs, (authorPr) => {
            if (authorPr.assignees.nodes.length) {
                return;
            }
            prs[authorPr.id] = authorPr;
        });
        if (!isCurrentRefresh(onyxKey, generation)) {
            return;
        }

        const prsWithIssues = await getLinkedIssues(prs);
        if (!isCurrentRefresh(onyxKey, generation)) {
            return;
        }

        await ReactNativeOnyx.set(onyxKey, prsWithIssues);
        const checks = await getChecks(prsWithIssues, () => isCurrentRefresh(onyxKey, generation));
        if (!isCurrentRefresh(onyxKey, generation) || _.isEmpty(checks)) {
            return;
        }
        await ReactNativeOnyx.merge(onyxKey, checks);
    });
}

function getReviewing() {
    return ActionThrottle('getReviewing', async () => {
        const onyxKey = ONYXKEYS.PRS.REVIEWING;
        const generation = beginRefresh(onyxKey);
        const values = await Promise.all([
            API.getPullsByType('review-requested'),
            API.getPullsByType('reviewed-by'),
        ]);
        const reviewRequested = _.mapObject(values[0], pr => ({...pr, isReviewRequested: true}));
        const reviewedBy = _.mapObject(values[1], pr => ({...pr, isReviewRequested: false}));
        const allPRs = {...reviewedBy, ...reviewRequested};
        const currentUser = API.getCurrentUser();
        const prsAuthoredByOtherUsers = _.chain(allPRs)
            .reject(pr => pr.author.login === currentUser)
            .reject(pr => _.any(pr.assignees.nodes, assignee => assignee.login === currentUser))
            .indexBy('id')
            .value();
        if (!isCurrentRefresh(onyxKey, generation)) {
            return;
        }

        await ReactNativeOnyx.set(onyxKey, prsAuthoredByOtherUsers);
        const checks = await getChecks(prsAuthoredByOtherUsers, () => isCurrentRefresh(onyxKey, generation));
        if (!isCurrentRefresh(onyxKey, generation) || _.isEmpty(checks)) {
            return;
        }
        await ReactNativeOnyx.merge(onyxKey, checks);
    });
}

/**
 * @param {Object} checkboxes
 * @param {Boolean} [checkboxes.shouldHideDraft]
 * @param {Boolean} [checkboxes.shouldHideAlreadyReviewed]
 * @param {Boolean} [checkboxes.shouldHideOnHold]
 */
function saveCheckboxes(checkboxes) {
    ReactNativeOnyx.merge(ONYXKEYS.PRS.CHECKBOXES, checkboxes);
}

export {
    getAssigned,
    getReviewing,
    saveCheckboxes,
};
