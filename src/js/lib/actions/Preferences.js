import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

let ghToken;
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
    ReactNativeOnyx.merge(ONYXKEYS.AUTH, authData);
}

ReactNativeOnyx.connect({
    key: ONYXKEYS.PREFERENCES,
    callback: (preferences) => {
        // Make sure they have entered their API token
        if (!preferences) {
            return;
        }

        ghToken = preferences.ghToken;
    },
});

ReactNativeOnyx.connect({
    key: ONYXKEYS.AUTH,
    callback: (auth) => {
        if (!auth) {
            return;
        }
        authData = {...authData, ...auth};
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
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {ghToken: null});
    ReactNativeOnyx.merge(ONYXKEYS.AUTH, authData);
}

/**
 * Check if user is authenticated (has either PAT or valid OAuth token)
 * @returns {boolean}
 */
function isAuthenticated() {
    return !!(ghToken || (authData.type === 'oauth' && authData.token && isTokenValid()));
}

export {
    getGitHubToken,
    setGitHubToken,
    getAuthType,
    setAuthData,
    clearAuth,
    isAuthenticated,
    isTokenValid,
};
