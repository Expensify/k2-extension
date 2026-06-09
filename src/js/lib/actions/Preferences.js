import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

let ghToken;
let useAbsoluteTimestamps;
let autoLoadMoreComments;
let showOpenAllButtons;
let authData = {
    type: 'pat', // 'pat' for Personal Access Token, 'oauth' for OAuth
    token: null,
    refreshToken: null,
    expiresAt: null,
};

/**
 * Check if OAuth token is still valid
 * @returns {boolean}
 */
function isTokenValid() {
    if (!authData.expiresAt) {
        return true; // GitHub OAuth tokens don't expire by default
    }
    return new Date().getTime() < authData.expiresAt;
}

/**
 * Set OAuth authentication data
 * @param {Object} data - OAuth data containing token, refreshToken, etc.
 */
function setAuthData(data) {
    authData = {...authData, ...data};
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {auth: authData});
}

ReactNativeOnyx.connect({
    key: ONYXKEYS.PREFERENCES,
    callback: (preferences) => {
        // Make sure they have entered their API token
        if (!preferences) {
            return;
        }

        ghToken = preferences.ghToken;
        if (preferences.auth) {
            authData = {...authData, ...preferences.auth};
        }
        useAbsoluteTimestamps = !!preferences.useAbsoluteTimestamps;
        autoLoadMoreComments = preferences.autoLoadMoreComments || false;
        showOpenAllButtons = preferences.showOpenAllButtons;
    },
});

function getGitHubToken() {
    // Return OAuth token if available and valid, otherwise return PAT
    if (authData.type === 'oauth' && authData.token && isTokenValid()) {
        return authData.token;
    }
    return ghToken;
}

/**
 * Get current authentication type
 * @returns {String} 'pat' or 'oauth'
 */
function getAuthType() {
    return authData.type;
}

/**
 * Get a copy of the current auth data (type, token, refreshToken, expiresAt)
 * @returns {Object}
 */
function getAuthData() {
    return {...authData};
}

/**
 * Set Personal Access Token
 * @param {String} value
 */
function setGitHubToken(value) {
    ghToken = value;
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {ghToken: value});

    // If setting a PAT, update auth type
    if (value) {
        setAuthData({type: 'pat'});
    }
}

/**
 * Clear all authentication data
 */
function clearAuth() {
    ghToken = null;
    authData = {
        type: 'pat',
        token: null,
        refreshToken: null,
        expiresAt: null,
    };
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {ghToken: null, auth: authData});
}

/**
 * Check if user is authenticated (has either PAT or valid OAuth token)
 * @returns {boolean}
 */
function isAuthenticated() {
    return !!(ghToken || (authData.type === 'oauth' && authData.token && isTokenValid()));
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
    getAuthType,
    getAuthData,
    setAuthData,
    clearAuth,
    isAuthenticated,
    isTokenValid,
    getUseAbsoluteTimestamps,
    setUseAbsoluteTimestamps,
    getAutoLoadMoreComments,
    setAutoLoadMoreComments,
    getShowOpenAllButtons,
    setShowOpenAllButtons,
};
