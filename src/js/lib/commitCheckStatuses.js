import _ from 'underscore';
import ReactNativeOnyx from 'react-native-onyx';
import * as Preferences from './actions/Preferences';
import * as CheckStatusVerdicts from './checkStatusVerdicts';
import ONYXKEYS from '../ONYXKEYS';

// Marks an indicator we have rewritten, so it can be found again and put back if the commit turns out to
// be failing after all. Without it a rewritten indicator no longer matches anything we look for.
const REWRITTEN_ATTRIBUTE = 'data-k2-ignoring-peer-review';

// GitHub renders the per-commit status indicator with two different components, so both have to be
// rewritten to cover a whole PR: the React commit rows on the "Commits" tab, and the server-rendered rows
// in the conversation timeline.
const REACT_COMMIT_ROW_SELECTOR = '[data-testid="commit-row-item"]';
const REACT_BADGE_SELECTOR = `[data-testid="checks-status-badge-button"][aria-label="Status checks: failure"], [data-testid="checks-status-badge-button"][${REWRITTEN_ATTRIBUTE}]`;
const TIMELINE_INDICATOR_SELECTOR = `details.commit-build-statuses summary.color-fg-danger, details.commit-build-statuses summary[${REWRITTEN_ATTRIBUTE}]`;
const TIMELINE_DETAILS_SELECTOR = 'details.commit-build-statuses';

// The commit SHA has to come out of the markup rather than the URL because a PR page shows many commits at once.
const REACT_COMMIT_LINK_REGEX = /^\/([^/]+)\/([^/]+)\/pull\/\d+\/commits\/([0-9a-f]{40})$/;
const TIMELINE_STATUS_URL_REGEX = /^\/([^/]+)\/([^/]+)\/commit\/([0-9a-f]{40})\/status-details/;

const FAILING_LABEL = 'Status checks: failure';
const PASSING_LABEL = 'Status checks: success, ignoring the peer review check';
const FAILING_ICON_COLOR = 'var(--bgColor-danger-emphasis, var(--color-scale-red-4))';
const PASSING_ICON_COLOR = 'var(--bgColor-success-emphasis, var(--color-success-emphasis))';

// The `d` attributes of GitHub's octicon-check and octicon-x, which we swap between.
const CHECK_ICON_PATH = 'M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z';
// eslint-disable-next-line max-len
const X_ICON_PATH = 'M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z';

let observer = null;
let scanScheduled = false;
let preferenceSubscribed = false;

function replaceIcon(element, currentClass, newClass, iconPath) {
    const icon = element.querySelector(`svg.${currentClass}`);
    if (!icon) {
        return;
    }

    icon.classList.remove(currentClass);
    icon.classList.add(newClass);

    const path = icon.querySelector('path');
    if (path) {
        path.setAttribute('d', iconPath);
    }
}

function showAsPassing(indicator) {
    indicator.element.setAttribute(REWRITTEN_ATTRIBUTE, '');

    if (indicator.isReactBadge) {
        indicator.element.setAttribute('aria-label', PASSING_LABEL);
        indicator.element.style.setProperty('--checks-icon-color', PASSING_ICON_COLOR);
    } else {
        indicator.element.classList.remove('color-fg-danger');
        indicator.element.classList.add('color-fg-success');
    }

    replaceIcon(indicator.element, 'octicon-x', 'octicon-check', CHECK_ICON_PATH);
}

function showAsFailing(indicator) {
    indicator.element.removeAttribute(REWRITTEN_ATTRIBUTE);

    if (indicator.isReactBadge) {
        indicator.element.setAttribute('aria-label', FAILING_LABEL);
        indicator.element.style.setProperty('--checks-icon-color', FAILING_ICON_COLOR);
    } else {
        indicator.element.classList.remove('color-fg-success');
        indicator.element.classList.add('color-fg-danger');
    }

    replaceIcon(indicator.element, 'octicon-check', 'octicon-x', X_ICON_PATH);
}

/**
 * Every status indicator on the page that either shows a failure or is one we have already rewritten,
 * paired with the commit it belongs to.
 *
 * @returns {Array<Object>}
 */
function findIndicators() {
    const indicators = [];

    _.each(document.querySelectorAll(REACT_COMMIT_ROW_SELECTOR), (row) => {
        const badge = row.querySelector(REACT_BADGE_SELECTOR);
        const matches = (row.getAttribute('data-commit-link') || '').match(REACT_COMMIT_LINK_REGEX);
        if (badge && matches) {
            indicators.push({
                element: badge, isReactBadge: true, owner: matches[1], repo: matches[2], sha: matches[3],
            });
        }
    });

    _.each(document.querySelectorAll(TIMELINE_INDICATOR_SELECTOR), (summary) => {
        const details = summary.closest(TIMELINE_DETAILS_SELECTOR);
        const detailsUrl = (details && details.getAttribute('data-deferred-details-content-url')) || '';
        const matches = detailsUrl.match(TIMELINE_STATUS_URL_REGEX);
        if (matches) {
            indicators.push({
                element: summary, isReactBadge: false, owner: matches[1], repo: matches[2], sha: matches[3],
            });
        }
    });

    return indicators;
}

function scan() {
    _.each(findIndicators(), (indicator) => {
        const isRewritten = indicator.element.hasAttribute(REWRITTEN_ATTRIBUTE);
        const verdict = CheckStatusVerdicts.getVerdict(indicator.owner, indicator.repo, indicator.sha);

        // A null verdict means we have nothing to say yet, so whatever is on screen stays.
        if (verdict === true && !isRewritten) {
            showAsPassing(indicator);
        } else if (verdict === false && isRewritten) {
            showAsFailing(indicator);
        }
    });
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
        scan();
    });
}

function start() {
    if (observer) {
        return;
    }

    CheckStatusVerdicts.onVerdictSettled(scheduleScan);
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
