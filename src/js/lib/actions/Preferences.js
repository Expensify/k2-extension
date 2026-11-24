import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

let useAbsoluteTimestamps;
let autoLoadMoreComments;
let showOpenAllButtons;

ReactNativeOnyx.connect({
    key: ONYXKEYS.PREFERENCES,
    callback: preferences => {
        if (!preferences) {
            return;
        }

        useAbsoluteTimestamps = !!preferences.useAbsoluteTimestamps;
        autoLoadMoreComments = preferences.autoLoadMoreComments || false;
        showOpenAllButtons = preferences.showOpenAllButtons;
    },
});

/**
 * Return credentials stored by previous versions so they can be migrated once
 * to the background-owned auth store.
 * @param {Object|null} preferences
 * @returns {Object|null}
 */
function getLegacyGitHubAuth(preferences) {
    if (!preferences) {
        return null;
    }

    const {auth, ghToken} = preferences;
    if (auth && auth.type === 'oauth' && auth.token && auth.refreshToken) {
        return auth;
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
