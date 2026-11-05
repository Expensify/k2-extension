import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

let ghToken;
let useAbsoluteTimestamps;
let autoLoadMoreComments;
let showOpenAllButtons;
let legacyAuthData;

ReactNativeOnyx.connect({
    key: ONYXKEYS.PREFERENCES,
    callback: (preferences) => {
        // Make sure they have entered their API token
        if (!preferences) {
            return;
        }

        ghToken = preferences.ghToken;
        legacyAuthData = preferences.auth;
        useAbsoluteTimestamps = !!preferences.useAbsoluteTimestamps;
        autoLoadMoreComments = preferences.autoLoadMoreComments || false;
        showOpenAllButtons = preferences.showOpenAllButtons;
    },
});

/**
 * Return credentials stored by previous versions so they can be migrated once
 * to the background-owned auth store.
 * @returns {Object|null}
 */
function getLegacyGitHubAuth() {
    if (legacyAuthData && legacyAuthData.type === 'oauth' && legacyAuthData.token && legacyAuthData.refreshToken) {
        return {...legacyAuthData};
    }

    if (ghToken) {
        return {type: 'pat', token: ghToken};
    }

    return null;
}

/**
 * Remove only credentials from the legacy preferences record.
 */
function clearLegacyGitHubAuth() {
    ghToken = null;
    legacyAuthData = null;
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {ghToken: null, auth: null});
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

/**
 * @param {Boolean} value
 */
function setShouldShowPRNumbers(value) {
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {shouldShowPRNumbers: value});
}

/**
 * @param {Boolean} value
 */
function setShouldGroupPRsByIssue(value) {
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {shouldGroupPRsByIssue: value});
}

export {
    getLegacyGitHubAuth,
    clearLegacyGitHubAuth,
    getUseAbsoluteTimestamps,
    setUseAbsoluteTimestamps,
    getAutoLoadMoreComments,
    setAutoLoadMoreComments,
    getShowOpenAllButtons,
    setShowOpenAllButtons,
    setShouldShowPRNumbers,
    setShouldGroupPRsByIssue,
};
