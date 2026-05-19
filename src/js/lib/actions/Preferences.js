import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

let ghToken;
let useAbsoluteTimestamps;
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
        autoLoadMoreComments = preferences.autoLoadMoreComments;
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
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {useAbsoluteTimestamps: value});
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
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {autoLoadMoreComments: value});
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
    getAutoLoadMoreComments,
    setAutoLoadMoreComments,
    getShowOpenAllButtons,
    setShowOpenAllButtons,
};
