import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

let ghToken;
let useAbsoluteTimestamps;
let k2RepoUrl;
let autoLoadMoreComments;
let showOpenAllButtons;
ReactNativeOnyx.connect({
    key: ONYXKEYS.PREFERENCES,
    callback: (preferences) => {
        // Make sure they have entered their API token
        if (!preferences) {
            return;
        }

        ghToken = preferences.ghToken;
        useAbsoluteTimestamps = !!preferences.useAbsoluteTimestamps;
        k2RepoUrl = preferences.k2RepoUrl || null;
        autoLoadMoreComments = preferences.autoLoadMoreComments || false;
        showOpenAllButtons = preferences.showOpenAllButtons;
    },
});

function getGitHubToken() {
    return ghToken;
}

/**
 * @param {String} value
 */
function setGitHubToken(value) {
    ghToken = value;
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {ghToken: value});
}

function getUseAbsoluteTimestamps() {
    return !!useAbsoluteTimestamps;
}

/**
 * @param {Boolean} value
 */
function setUseAbsoluteTimestamps(value) {
    useAbsoluteTimestamps = value;
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {
        useAbsoluteTimestamps: value,
    });
}

function getK2RepoUrl() {
    return k2RepoUrl;
}

/**
 * @param {String} value
 */
function setK2RepoUrl(value) {
    k2RepoUrl = value;
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {k2RepoUrl: value});
}

// Defaults to true so users who haven't set the preference keep the original behaviour.
function getAutoLoadMoreComments() {
    return autoLoadMoreComments !== false;
}

/**
 * @param {Boolean} value
 */
function setAutoLoadMoreComments(value) {
    autoLoadMoreComments = value;
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {
        autoLoadMoreComments: value,
    });
}

// Defaults to true so users who haven't set the preference keep the original behaviour.
function getShowOpenAllButtons() {
    return showOpenAllButtons !== false;
}

/**
 * @param {Boolean} value
 */
function setShowOpenAllButtons(value) {
    showOpenAllButtons = value;
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {showOpenAllButtons: value});
}

export {
    getGitHubToken,
    setGitHubToken,
    getUseAbsoluteTimestamps,
    setUseAbsoluteTimestamps,
    getK2RepoUrl,
    setK2RepoUrl,
    getAutoLoadMoreComments,
    setAutoLoadMoreComments,
    getShowOpenAllButtons,
    setShowOpenAllButtons,
};
