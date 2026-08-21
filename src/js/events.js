import * as messenger from './lib/messenger';
import * as GitHubOAuth from './lib/GitHubOAuth';
import ksBrowser from './lib/browser';

let inflightRefreshPromise = null;

/**
 * @param {Object} tokenData
 * @returns {Object}
 */
function authDataFromTokenData(tokenData) {
    return {
        type: 'oauth',
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : null,
    };
}

/**
 * @param {Object} authData
 * @returns {Object}
 */
function tokenDataFromAuthData(authData) {
    const tokenData = {
        access_token: authData.token,
        refresh_token: authData.refreshToken,
    };

    if (authData.expiresAt) {
        tokenData.expires_in = Math.max(0, Math.floor((authData.expiresAt - Date.now()) / 1000));
    }

    return tokenData;
}

/**
 * @returns {Promise<Object|null>}
 */
function getStoredAuthData() {
    return Promise.resolve(ksBrowser.storage.local.get(GitHubOAuth.OAUTH_STORAGE_KEY))
        .then(result => (result && result[GitHubOAuth.OAUTH_STORAGE_KEY] ? result[GitHubOAuth.OAUTH_STORAGE_KEY] : null));
}

/**
 * @param {Object} authData
 * @returns {Promise<void>}
 */
function setStoredAuthData(authData) {
    return Promise.resolve(ksBrowser.storage.local.set({[GitHubOAuth.OAUTH_STORAGE_KEY]: authData}));
}

/**
 * @returns {Promise<void>}
 */
function clearStoredAuthData() {
    return Promise.resolve(ksBrowser.storage.local.remove(GitHubOAuth.OAUTH_STORAGE_KEY));
}

/**
 * @param {Object} authData
 * @returns {boolean}
 */
function isOAuthAuthData(authData) {
    return !!(authData && authData.type === 'oauth' && authData.token && authData.refreshToken);
}

/**
 * @param {Object} authData
 * @returns {boolean}
 */
function shouldRefreshAuthData(authData) {
    if (!isOAuthAuthData(authData) || !authData.expiresAt) {
        return false;
    }

    return (Date.now() + (5 * 60 * 1000)) >= authData.expiresAt;
}

/**
 * @param {Object} authData
 * @returns {Promise<Object>}
 */
function refreshStoredAuthData(authData) {
    if (inflightRefreshPromise) {
        return inflightRefreshPromise;
    }

    inflightRefreshPromise = GitHubOAuth.refreshToken(authData.refreshToken)
        .then((tokenData) => {
            const nextAuthData = authDataFromTokenData(tokenData);
            return setStoredAuthData(nextAuthData).then(() => nextAuthData);
        })
        .catch((error) => {
            if (error.isAuthError) {
                return clearStoredAuthData().then(() => {
                    throw error;
                });
            }

            throw error;
        })
        .finally(() => {
            inflightRefreshPromise = null;
        });

    return inflightRefreshPromise;
}

/**
 * @param {Object} request
 * @returns {Promise<Object>}
 */
async function getValidOAuthToken(request) {
    let authData = await getStoredAuthData();

    if (!authData && isOAuthAuthData(request.authData)) {
        authData = request.authData;
        await setStoredAuthData(authData);
    }

    if (!isOAuthAuthData(authData)) {
        return {success: false, error: 'No OAuth auth data', isAuthError: true};
    }

    if (request.forceRefresh || shouldRefreshAuthData(authData)) {
        authData = await refreshStoredAuthData(authData);
    }

    return {success: true, tokenData: tokenDataFromAuthData(authData)};
}

// Start navigation event publisher
messenger.startNavEventPublisher();

// Listen for OAuth events from content scripts. The background script owns
// extension-wide OAuth storage and refresh coordination; messages wake the MV3
// service worker when Chrome has suspended it.
ksBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'initiate-oauth') {
        GitHubOAuth.handleOAuthFlow()
            .then((result) => {
                if (!result.success) {
                    sendResponse(result);
                    return;
                }

                setStoredAuthData(authDataFromTokenData(result.tokenData))
                    .then(() => sendResponse(result));
            })
            .catch((error) => {
                sendResponse({success: false, error: error.message});
            });

        // Let the runtime know we'll send a response asynchronously
        return true;
    }

    if (request.action === 'get-valid-oauth-token') {
        getValidOAuthToken(request)
            .then((result) => {
                sendResponse(result);
            })
            .catch((error) => {
                sendResponse({success: false, error: error.message, isAuthError: !!error.isAuthError});
            });

        // Let the runtime know we'll send a response asynchronously
        return true;
    }

    if (request.action === 'clear-oauth') {
        clearStoredAuthData()
            .then(() => sendResponse({success: true}))
            .catch(error => sendResponse({success: false, error: error.message}));

        return true;
    }

    return false;
});
