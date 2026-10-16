import _ from 'underscore';
import * as API from './api';
import CONST from '../CONST';

// Turning a red X green is the one thing here that can mislead, so a check only counts as out of the way
// when it says so. Anything else — a conclusion we don't recognise, a check still running, a context type
// GitHub adds later — keeps the commit red.
const PASSING_CHECK_RUN_CONCLUSIONS = ['SUCCESS', 'NEUTRAL', 'SKIPPED'];

// Conversely, a check has to have definitely failed before we treat it as the reason GitHub shows a commit
// as failed, so this list is deliberately not the inverse of the one above.
const FAILED_CHECK_RUN_CONCLUSIONS = ['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE', 'STALE'];

const UNREPORTED_STATUS_CONTEXT_STATES = ['PENDING', 'EXPECTED'];

// How long a verdict lasts when the commit's checks could still report something new.
const VERDICT_LIFETIME_MS = 60000;

// Opening the commit list of a busy PR asks about every failing commit at once, so lookups are spread
// across several scans rather than opening a connection per commit.
const MAX_CONCURRENT_REQUESTS = 8;

// Keyed by owner/repo/SHA, because check runs belong to a repository as well as a commit and the same SHA
// shows up in more than one of them, most obviously a fork and the repository it was forked from.
const verdicts = {};
const requestsInFlight = {};

// A page has usually stopped changing by the time a verdict lands, so whatever is showing the status has
// to be told rather than left to notice on its own.
const settledListeners = [];

function getWorkflowPath(context) {
    const checkSuite = context.checkSuite || {};
    const workflowRun = checkSuite.workflowRun || {};
    return (workflowRun.workflow && workflowRun.workflow.resourcePath) || '';
}

/**
 * Whether a check is one we deliberately don't hold against a commit. Matching on name alone would let a
 * PR author hide a real failure by naming one of their own jobs after the peer review check, so the run
 * it came from has to be the ruleset-required one as well.
 *
 * @param {Object} context
 * @returns {Boolean}
 */
function isIgnoredCheck(context) {
    return context.type === 'CheckRun'
        && _.contains(CONST.IGNORED_CHECK_RUN_NAMES, context.name)
        && getWorkflowPath(context).indexOf(CONST.PEER_REVIEW_WORKFLOW_PATH) > -1;
}

function isPassing(context) {
    if (context.type === 'CheckRun') {
        return context.status === 'COMPLETED' && _.contains(PASSING_CHECK_RUN_CONCLUSIONS, context.conclusion);
    }
    return context.type === 'StatusContext' && context.state === 'SUCCESS';
}

function hasFailed(context) {
    if (context.type === 'CheckRun') {
        return context.status === 'COMPLETED' && _.contains(FAILED_CHECK_RUN_CONCLUSIONS, context.conclusion);
    }
    return context.type === 'StatusContext' && (context.state === 'FAILURE' || context.state === 'ERROR');
}

function hasReported(context) {
    if (context.type === 'CheckRun') {
        return context.status === 'COMPLETED';
    }
    return context.type === 'StatusContext' && !_.contains(UNREPORTED_STATUS_CONTEXT_STATES, context.state);
}

/**
 * Whether a commit that GitHub shows as failing only fails because of checks we ignore.
 *
 * @param {Array<Object>} contexts
 * @returns {Boolean}
 */
function onlyIgnoredChecksAreFailing(contexts) {
    const [ignoredContexts, contextsThatCount] = _.partition(contexts, isIgnoredCheck);

    // An ignored check has to be the thing making GitHub show the commit as failed. Requiring that is also
    // what keeps a response we couldn't read from turning a genuinely failing commit green.
    if (!_.any(ignoredContexts, hasFailed)) {
        return false;
    }

    return _.all(contextsThatCount, isPassing);
}

/**
 * Whether a commit should be shown as passing, or null while there is no verdict worth acting on. Requests
 * one in the background when the one we have has expired.
 *
 * @param {String} owner
 * @param {String} repo
 * @param {String} sha
 * @returns {Boolean|null}
 */
function getVerdict(owner, repo, sha) {
    const key = `${owner}/${repo}/${sha}`;
    const verdict = verdicts[key];

    if (verdict && (verdict.isFinal || (Date.now() - verdict.fetchedAt) <= VERDICT_LIFETIME_MS)) {
        return verdict.shouldShowAsPassing;
    }

    if (!requestsInFlight[key] && _.size(requestsInFlight) < MAX_CONCURRENT_REQUESTS) {
        requestsInFlight[key] = true;
        API.getStatusCheckRollup(owner, repo, sha)
            .then((contexts) => {
                const shouldShowAsPassing = onlyIgnoredChecksAreFailing(contexts);
                verdicts[key] = {
                    shouldShowAsPassing,

                    // A commit that is failing with every check reported can't change without something
                    // being re-run, so that verdict is worth keeping and a PR full of failing commits
                    // stops asking about them. Everything else expires, including a commit still waiting
                    // on checks, which is the usual state of one being worked on.
                    isFinal: !shouldShowAsPassing && contexts.length > 0 && _.all(contexts, hasReported),
                    fetchedAt: Date.now(),
                };
            })
            .catch((error) => {
                console.error('Error fetching check statuses for commit', sha, error);

                // Recording the failure is what stops a bad token or a rate limit from turning every scan
                // into another request. A null verdict leaves the status as GitHub rendered it.
                verdicts[key] = {shouldShowAsPassing: null, isFinal: false, fetchedAt: Date.now()};
            })
            .finally(() => {
                delete requestsInFlight[key];

                // This also releases a request slot, so anything that couldn't get one earlier can retry.
                _.each(settledListeners, listener => listener());
            });
    }

    return null;
}

/**
 * Registers a callback to run whenever a lookup finishes, so a page that has already settled gets told
 * about a verdict rather than waiting for its next change.
 *
 * @param {Function} listener
 */
function onVerdictSettled(listener) {
    settledListeners.push(listener);
}

export {
    getVerdict,
    onVerdictSettled,
};
