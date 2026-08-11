import _ from 'underscore';
import ReactNativeOnyx from 'react-native-onyx';
import * as API from './api';
import * as Preferences from './actions/Preferences';
import * as CheckStatusVerdicts from './checkStatusVerdicts';
import ONYXKEYS from '../ONYXKEYS';

// GitHub serves its own favicon for each state and swaps the link between them as a PR's checks report in,
// so this only has to point the link at the asset GitHub already has. Drawing a replacement icon instead
// would mean fetching, decoding and re-encoding it, and a tab falls back to the browser's default globe if
// any step of that chain fails.
const FAVICON_LINK_SELECTOR = 'link.js-site-favicon';
const FAILURE_FAVICON_REGEX = /-failure(\.\w+)(\?.*)?$/;

// Holds the href GitHub had set, so it can be put back exactly rather than rebuilt.
const REWRITTEN_ATTRIBUTE = 'data-k2-original-favicon';

const PULL_REQUEST_PATH_REGEX = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/|$)/;

// The favicon reports on the pull request as a whole, which is the state of its head commit. That commit
// changes when the author pushes, so this is worth re-reading periodically.
const HEAD_REF_OID_LIFETIME_MS = 60000;

const headRefOids = {};
const requestsInFlight = {};

let observer = null;
let updateScheduled = false;
let preferenceSubscribed = false;

// Coalesce the burst of head changes GitHub makes on load into a single update.
function scheduleUpdate() {
    if (updateScheduled) {
        return;
    }
    updateScheduled = true;
    requestAnimationFrame(() => {
        updateScheduled = false;

        // eslint-disable-next-line no-use-before-define
        update();
    });
}

/**
 * The commit at the head of the pull request being viewed, or null until we know it. Requests it in the
 * background when what we have has expired.
 *
 * @param {String} owner
 * @param {String} repo
 * @param {String} pullRequestNumber
 * @returns {String|null}
 */
function getHeadRefOid(owner, repo, pullRequestNumber) {
    const key = `${owner}/${repo}/${pullRequestNumber}`;
    const cached = headRefOids[key];

    if (!cached || (Date.now() - cached.fetchedAt) > HEAD_REF_OID_LIFETIME_MS) {
        if (!requestsInFlight[key]) {
            requestsInFlight[key] = true;
            API.getPullRequestHeadRefOid(owner, repo, Number(pullRequestNumber))
                .then((oid) => {
                    headRefOids[key] = {oid, fetchedAt: Date.now()};
                })
                .catch((error) => {
                    console.error('Error fetching the head commit of pull request', key, error);

                    // Recording the failure is what stops a bad token or a rate limit from turning every
                    // pass into another request.
                    headRefOids[key] = {oid: null, fetchedAt: Date.now()};
                })
                .finally(() => {
                    delete requestsInFlight[key];
                    scheduleUpdate();
                });
        }
    }

    // A head commit that has moved on is still the right one to ask about while its replacement is on the
    // way, because the checks it is being replaced by haven't reported yet either.
    return cached ? cached.oid : null;
}

function update() {
    const links = document.querySelectorAll(FAVICON_LINK_SELECTOR);
    const matches = window.location.pathname.match(PULL_REQUEST_PATH_REGEX);

    if (!matches) {
        // GitHub owns the favicon everywhere else, so forget the pull request we were on rather than
        // putting its icon back over whatever it has set since.
        _.each(links, link => link.removeAttribute(REWRITTEN_ATTRIBUTE));
        return;
    }

    const [, owner, repo, pullRequestNumber] = matches;
    const headRefOid = getHeadRefOid(owner, repo, pullRequestNumber);
    const verdict = headRefOid ? CheckStatusVerdicts.getVerdict(owner, repo, headRefOid) : null;

    _.each(links, (link) => {
        const originalHref = link.getAttribute(REWRITTEN_ATTRIBUTE);
        const href = link.getAttribute('href') || '';

        // A null verdict means we have nothing to say yet, so whatever GitHub has set stays.
        if (verdict === true && FAILURE_FAVICON_REGEX.test(href)) {
            link.setAttribute(REWRITTEN_ATTRIBUTE, href);
            link.setAttribute('href', href.replace(FAILURE_FAVICON_REGEX, '-success$1$2'));
        } else if (verdict === false && originalHref) {
            link.setAttribute('href', originalHref);
            link.removeAttribute(REWRITTEN_ATTRIBUTE);
        }
    });
}

function start() {
    if (observer) {
        return;
    }

    CheckStatusVerdicts.onVerdictSettled(scheduleUpdate);
    scheduleUpdate();

    // GitHub sets the favicon after the page has loaded and again whenever the checks it is reporting on
    // change, either of which puts the red X back.
    observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.head, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['href'],
    });
}

/**
 * Shows the tab's favicon as passing when the only check holding the pull request back is one we ignore,
 * so a tab left open while iterating still says whether the tests are passing.
 */
function initPrFavicon() {
    // Every lookup needs the API, and an unauthenticated Octokit gets cached for the life of the page, so
    // nothing here may touch it until the token the user entered on the dashboard has loaded out of Onyx.
    // That includes the pass below: one early call poisons every request the extension makes afterwards.
    if (Preferences.getGitHubToken()) {
        start();

        // GitHub swaps page content without reloading, so a pull request opened from another page needs
        // another pass even though the observer is already attached.
        scheduleUpdate();
        return;
    }

    if (preferenceSubscribed) {
        return;
    }
    preferenceSubscribed = true;

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
export {initPrFavicon};
