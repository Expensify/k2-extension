import * as messenger from './lib/messenger';
import * as GitHubOAuth from './lib/GitHubOAuth';
import ksBrowser from './lib/browser';

let inflightRefreshPromise = null;

const GITHUB_AUTH_STORAGE_KEY = 'k2GitHubAuth';
const LEGACY_OAUTH_STORAGE_KEY = 'k2OAuthAuth';
const GITHUB_AUTH_MIGRATED_STORAGE_KEY = 'k2GitHubAuthMigrated';
const REFRESH_SKEW_MS = 5 * 60 * 1000;
const TOKEN_JUST_ISSUED_MS = 30 * 1000;

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
        issuedAt: Date.now(),
    };
}

/**
 * @param {Object|null} authData
 * @returns {boolean}
 */
function isPATAuthData(authData) {
    return !!(authData && authData.type === 'pat' && authData.token);
}

/**
 * @param {Object|null} authData
 * @returns {boolean}
 */
function isOAuthAuthData(authData) {
    return !!(authData && authData.type === 'oauth' && authData.token && authData.refreshToken);
}

/**
 * @param {Object|null} authData
 * @returns {Object|null}
 */
function normalizeAuthData(authData) {
    if (isOAuthAuthData(authData)) {
        return {
            type: 'oauth',
            token: authData.token,
            refreshToken: authData.refreshToken,
            expiresAt: authData.expiresAt || null,
            issuedAt: authData.issuedAt || 0,
        };
    }

    if (isPATAuthData(authData)) {
        return {type: 'pat', token: authData.token};
    }

    return null;
}

/**
 * @returns {Promise<void>}
 */
function clearStoredAuthData() {
    return Promise.resolve(ksBrowser.storage.local.remove([GITHUB_AUTH_STORAGE_KEY, LEGACY_OAUTH_STORAGE_KEY]));
}

/**
 * @param {Object|null} authData
 * @returns {Promise<void>}
 */
function setStoredAuthData(authData) {
    return Promise.resolve(ksBrowser.storage.local.set({[GITHUB_AUTH_STORAGE_KEY]: authData}));
}

/**
 * @returns {Promise<Object|null>}
 */
async function getStoredAuthData() {
    const result = await Promise.resolve(ksBrowser.storage.local.get([
        GITHUB_AUTH_STORAGE_KEY,
        LEGACY_OAUTH_STORAGE_KEY,
    ]));
    const authData = normalizeAuthData(result && result[GITHUB_AUTH_STORAGE_KEY]);
    if (authData) {
        return authData;
    }

    const legacyAuthData = normalizeAuthData(result && result[LEGACY_OAUTH_STORAGE_KEY]);
    if (!legacyAuthData) {
        return null;
    }

    await setStoredAuthData(legacyAuthData);
    await Promise.resolve(ksBrowser.storage.local.remove(LEGACY_OAUTH_STORAGE_KEY));
    return legacyAuthData;
}

/**
 * @param {Object|null} authData
 * @returns {boolean}
 */
function shouldRefreshAuthData(authData) {
    return !!(isOAuthAuthData(authData) && authData.expiresAt && (Date.now() + REFRESH_SKEW_MS) >= authData.expiresAt);
}

/**
 * @param {Object|null} authData
 * @returns {Object}
 */
function getAuthState(authData) {
    return {
        authenticated: !!authData,
        authType: authData ? authData.type : null,
    };
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
async function getValidGitHubToken(request) {
    let authData = await getStoredAuthData();
    if (!authData) {
        return {success: false, error: 'No GitHub auth data', isAuthError: true};
    }

    if (authData.type === 'oauth' && request.rejectedToken && request.rejectedToken !== authData.token) {
        return {success: true, token: authData.token, authType: authData.type};
    }

    if (authData.type === 'oauth' && request.forceRefresh && (Date.now() - authData.issuedAt) < TOKEN_JUST_ISSUED_MS) {
        await clearStoredAuthData();
        return {success: false, error: 'The newly issued OAuth token was rejected', isAuthError: true};
    }

    if (authData.type === 'oauth' && (request.forceRefresh || shouldRefreshAuthData(authData))) {
        authData = await refreshStoredAuthData(authData);
    }

    return {success: true, token: authData.token, authType: authData.type};
}

/**
 * @param {Object} request
 * @returns {Promise<Object>}
 */
async function migrateLegacyAuth(request) {
    const result = await Promise.resolve(ksBrowser.storage.local.get(GITHUB_AUTH_MIGRATED_STORAGE_KEY));
    const authData = await getStoredAuthData();
    if (authData) {
        await Promise.resolve(ksBrowser.storage.local.set({[GITHUB_AUTH_MIGRATED_STORAGE_KEY]: true}));
        return {success: true, migrated: true, ...getAuthState(authData)};
    }

    if (result && result[GITHUB_AUTH_MIGRATED_STORAGE_KEY]) {
        return {success: true, migrated: false, ...getAuthState(null)};
    }

    const legacyAuthData = normalizeAuthData(request.authData);
    if (!legacyAuthData) {
        return {success: true, migrated: false, ...getAuthState(null)};
    }

    await setStoredAuthData(legacyAuthData);
    await Promise.resolve(ksBrowser.storage.local.set({[GITHUB_AUTH_MIGRATED_STORAGE_KEY]: true}));
    return {success: true, migrated: true, ...getAuthState(legacyAuthData)};
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
                    .then(() => Promise.resolve(ksBrowser.storage.local.set({[GITHUB_AUTH_MIGRATED_STORAGE_KEY]: true})))
                    .then(() => sendResponse({success: true, authenticated: true, authType: 'oauth'}));
            })
            .catch((error) => {
                sendResponse({success: false, error: error.message});
            });

        // Let the runtime know we'll send a response asynchronously
        return true;
    }

    if (request.action === 'get-valid-github-token') {
        getValidGitHubToken(request)
            .then((result) => {
                sendResponse(result);
            })
            .catch((error) => {
                sendResponse({success: false, error: error.message, isAuthError: !!error.isAuthError});
            });

        // Let the runtime know we'll send a response asynchronously
        return true;
    }

    if (request.action === 'get-github-auth-state') {
        getStoredAuthData()
            .then(authData => sendResponse({success: true, ...getAuthState(authData)}))
            .catch(error => sendResponse({success: false, error: error.message}));

        return true;
    }

    if (request.action === 'migrate-legacy-github-auth') {
        migrateLegacyAuth(request)
            .then(sendResponse)
            .catch(error => sendResponse({success: false, error: error.message}));

        return true;
    }

    if (request.action === 'clear-github-auth') {
        clearStoredAuthData()
            .then(() => Promise.resolve(ksBrowser.storage.local.set({[GITHUB_AUTH_MIGRATED_STORAGE_KEY]: true})))
            .then(() => sendResponse({success: true}))
            .catch(error => sendResponse({success: false, error: error.message}));

        return true;
    }

    return false;
});
