import _ from 'underscore';
import ReactNativeOnyx from 'react-native-onyx';
import * as API from './api';
import * as Preferences from './actions/Preferences';
import ONYXKEYS from '../ONYXKEYS';
import CONST from '../CONST';

// GitHub renders the per-commit status indicator with two different components, so both have
// to be rewritten to cover a whole PR: the React commit rows on the "Commits" tab, and the
// server-rendered rows in the conversation timeline.
const REACT_COMMIT_ROW_SELECTOR = '[data-testid="commit-row-item"]';
const REACT_FAILING_BADGE_SELECTOR = '[data-testid="checks-status-badge-button"][aria-label="Status checks: failure"]';
const TIMELINE_FAILING_INDICATOR_SELECTOR = 'details.commit-build-statuses summary.color-fg-danger';

// The commit SHA has to come out of the markup rather than the URL because a PR page shows many commits at once.
const REACT_COMMIT_LINK_REGEX = /^\/([^/]+)\/([^/]+)\/pull\/\d+\/commits\/([0-9a-f]{40})$/;
const TIMELINE_STATUS_URL_REGEX = /^\/([^/]+)\/([^/]+)\/commit\/([0-9a-f]{40})\/status-details/;

// The `d` attribute of GitHub's octicon-check, which replaces the octicon-x we are hiding.
const CHECK_ICON_PATH = 'M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z';

// Conclusions that make GitHub show a commit as failed. A check run that has any other conclusion
// (success, skipped, neutral) is not something that keeps a commit from being green.
const FAILED_CHECK_RUN_CONCLUSIONS = ['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE'];
const FAILED_STATUS_CONTEXT_STATES = ['ERROR', 'FAILURE'];
const UNFINISHED_STATUS_CONTEXT_STATES = ['PENDING', 'EXPECTED'];

// A commit high up in a PR's history never changes, but the head commit's checks do, so verdicts
// are only trusted for as long as it takes a check to plausibly finish and report a new result.
const VERDICT_LIFETIME_MS = 60000;

// Keyed by commit SHA, so that scrolling through a PR doesn't re-request the same commit's checks.
const verdicts = {};
const requestsInFlight = {};

let observer = null;
let scanScheduled = false;
let preferenceSubscribed = false;

function getContextName(context) {
    return context.type === 'CheckRun' ? context.name : context.context;
}

function isFailing(context) {
    if (context.type === 'CheckRun') {
        return _.contains(FAILED_CHECK_RUN_CONCLUSIONS, context.conclusion);
    }
    return _.contains(FAILED_STATUS_CONTEXT_STATES, context.state);
}

function isUnfinished(context) {
    if (context.type === 'CheckRun') {
        return context.status !== 'COMPLETED';
    }
    return _.contains(UNFINISHED_STATUS_CONTEXT_STATES, context.state);
}

/**
 * Whether a commit that GitHub shows as failing only fails because of checks we ignore.
 * Checks that are still running count against it, because until they finish we can't tell
 * whether the ignored check really is the only failure.
 *
 * @param {Array<Object>} contexts
 * @returns {Boolean}
 */
function onlyIgnoredChecksAreFailing(contexts) {
    const contextsThatCount = _.reject(contexts, context => _.contains(CONST.IGNORED_CHECK_RUN_NAMES, getContextName(context)));
    return !_.any(contextsThatCount, context => isFailing(context) || isUnfinished(context));
}

// Coalesce bursts of mutations into a single scan per animation frame so that the rapid
// stream of DOM changes during page load doesn't trigger a scan per node.
function scheduleScan() {
    if (scanScheduled) {
        return;
    }
    scanScheduled = true;
    requestAnimationFrame(() => {
        scanScheduled = false;

        // eslint-disable-next-line no-use-before-define
        scan();
    });
}

/**
 * The verdict for a commit, requesting it in the background when we don't have a fresh one yet.
 * Returns undefined while a commit has never been looked up.
 *
 * @param {String} owner
 * @param {String} repo
 * @param {String} sha
 * @returns {Boolean|undefined}
 */
function getVerdict(owner, repo, sha) {
    const verdict = verdicts[sha];
    const isStale = !verdict || (Date.now() - verdict.fetchedAt) > VERDICT_LIFETIME_MS;

    if (isStale && !requestsInFlight[sha]) {
        requestsInFlight[sha] = true;
        API.getStatusCheckRollup(owner, repo, sha)
            .then((contexts) => {
                verdicts[sha] = {onlyIgnoredChecksFailed: onlyIgnoredChecksAreFailing(contexts), fetchedAt: Date.now()};

                // The page is usually done changing by the time a verdict lands, so nothing else would scan again.
                scheduleScan();
            })
            .catch((error) => {
                console.error('Error fetching check statuses for commit', sha, error);
            })
            .finally(() => {
                delete requestsInFlight[sha];
            });
    }

    // A stale verdict is still shown while its replacement is on the way, so the indicator doesn't flicker.
    return verdict && verdict.onlyIgnoredChecksFailed;
}

/**
 * Turns a red X octicon into a green check octicon.
 *
 * @param {Element} indicator The element holding the octicon
 */
function replaceFailureIcon(indicator) {
    const icon = indicator.querySelector('svg.octicon-x');
    if (!icon) {
        return;
    }

    icon.classList.remove('octicon-x');
    icon.classList.add('octicon-check');

    const path = icon.querySelector('path');
    if (path) {
        path.setAttribute('d', CHECK_ICON_PATH);
    }
}

function scan() {
    _.each(document.querySelectorAll(REACT_COMMIT_ROW_SELECTOR), (row) => {
        const badge = row.querySelector(REACT_FAILING_BADGE_SELECTOR);
        const matches = (row.getAttribute('data-commit-link') || '').match(REACT_COMMIT_LINK_REGEX);
        if (!badge || !matches) {
            return;
        }

        if (!getVerdict(matches[1], matches[2], matches[3])) {
            return;
        }

        badge.setAttribute('aria-label', 'Status checks: success');
        badge.style.setProperty('--checks-icon-color', 'var(--bgColor-success-emphasis, var(--color-success-emphasis))');
        replaceFailureIcon(badge);
    });

    _.each(document.querySelectorAll(TIMELINE_FAILING_INDICATOR_SELECTOR), (indicator) => {
        const detailsUrl = indicator.parentElement.getAttribute('data-deferred-details-content-url') || '';
        const matches = detailsUrl.match(TIMELINE_STATUS_URL_REGEX);
        if (!matches) {
            return;
        }

        if (!getVerdict(matches[1], matches[2], matches[3])) {
            return;
        }

        indicator.classList.remove('color-fg-danger');
        indicator.classList.add('color-fg-success');
        replaceFailureIcon(indicator);
    });
}

function start() {
    if (observer) {
        return;
    }

    scheduleScan();

    // GitHub re-renders these indicators as checks report in, which puts the red X back.
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, {childList: true, subtree: true});
}

/**
 * Shows a commit as passing when the only check holding it back is one we ignore, so that a PR's
 * commit history still says which commits had their tests passing.
 */
function initCommitCheckStatuses() {
    if (preferenceSubscribed) {
        return;
    }
    preferenceSubscribed = true;

    // Every lookup needs the API, and an unauthenticated Octokit gets cached for the life of the page,
    // so nothing can start until the token the user entered on the dashboard has loaded out of Onyx.
    if (Preferences.getGitHubToken()) {
        start();
        return;
    }

    ReactNativeOnyx.connect({
        key: ONYXKEYS.PREFERENCES,
        callback: () => {
            if (!Preferences.getGitHubToken()) {
                return;
            }
            start();
        },
    });
}

// eslint-disable-next-line import/prefer-default-export
export {initCommitCheckStatuses};
