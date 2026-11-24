import ksBrowser from './browser';

/**
 * GitHub OAuth Configuration
 *
 * The OAuth flow is handled by the Cloudflare Worker OAuth service.
 * Only the public CLIENT_ID is kept in the extension; the secret lives on the worker.
 */

const GITHUB_OAUTH_CONFIG = {
    CLIENT_ID: 'Iv23lijMLQsnRac742az',
    APP_OAUTH_URL: 'https://ksv2.exfy.io',
};

let inflightTokenPromise = null;
const GITHUB_AUTH_STORAGE_KEY = 'k2GitHubAuth';
const LEGACY_OAUTH_STORAGE_KEY = 'k2OAuthAuth';

function didAuthChange(change) {
    return change && !!change.oldValue !== !!change.newValue;
}

/**
 * @param {Function} callback
 */
function onAuthStateChange(callback) {
    ksBrowser.storage.onChanged.addListener((changes, area) => {
        if (
            area !== 'local' ||
            (!didAuthChange(changes[GITHUB_AUTH_STORAGE_KEY]) &&
                !didAuthChange(changes[LEGACY_OAUTH_STORAGE_KEY]))
        ) {
            return;
        }
        callback();
    });
}

/**
 * Send a message to the background auth broker.
 * @param {Object} request
 * @returns {Promise<Object>}
 */
function sendAuthMessage(request) {
    return new Promise((resolve, reject) => {
        if (!ksBrowser || !ksBrowser.runtime || !ksBrowser.runtime.sendMessage) {
            reject(new Error('Browser runtime API not available'));
            return;
        }

        ksBrowser.runtime.sendMessage(request, response => {
            if (ksBrowser.runtime.lastError) {
                reject(new Error(ksBrowser.runtime.lastError.message));
                return;
            }

            if (!response) {
                reject(new Error('No response from background script'));
                return;
            }

            if (!response.success) {
                const error = new Error(response.error || 'GitHub authentication request failed');
                error.isAuthError = !!response.isAuthError;
                reject(error);
                return;
            }

            resolve(response);
        });
    });
}

/**
 * @returns {Promise<Object>}
 */
function getAuthState() {
    return sendAuthMessage({action: 'get-github-auth-state'});
}

/**
 * @param {Object|null} authData
 * @returns {Promise<Object>}
 */
function migrateLegacyAuth(authData) {
    return sendAuthMessage({action: 'migrate-legacy-github-auth', authData});
}

/**
 * @param {string|null} rejectedToken Only clear credentials if this token is still stored.
 * @returns {Promise<void>}
 */
async function clearGitHubAuth(rejectedToken = null) {
    await sendAuthMessage({action: 'clear-github-auth', rejectedToken});
}

/**
 * Initiate OAuth flow with GitHub using background script
 * @returns {Promise<Object>} Authentication state
 */
function initiateOAuth() {
    return sendAuthMessage({action: 'initiate-oauth'});
}

/**
 * Check if OAuth is available (browser extension context)
 * @returns {boolean} Whether OAuth is available
 */
function isOAuthAvailable() {
    return !!(ksBrowser && ksBrowser.runtime && ksBrowser.runtime.sendMessage);
}

/**
 * Refresh the OAuth token using the refresh token. This is a pure network call:
 * it does not touch storage. The background script persists the returned tokens.
 *
 * Errors are tagged with `isAuthError: true` when the refresh token itself was
 * rejected (i.e. the user must re-authenticate), as opposed to transient
 * network failures.
 *
 * @param {string} refreshTokenValue - The refresh token to use
 * @returns {Promise<Object>} Full token data ({access_token, refresh_token, expires_in})
 */
async function refreshToken(refreshTokenValue) {
    if (!refreshTokenValue) {
        const error = new Error('No refresh token provided');
        error.isAuthError = true;
        throw error;
    }

    let resp;
    try {
        resp = await fetch(`${GITHUB_OAUTH_CONFIG.APP_OAUTH_URL}/oauth/github/refresh`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: refreshTokenValue,
            }),
        });
    } catch (networkError) {
        // Network failure (offline, laptop just woke, etc.) - NOT an auth error
        throw new Error(`Refresh request failed: ${networkError.message}`);
    }

    if (!resp.ok) {
        const error = new Error(`Refresh failed: ${resp.status} ${resp.statusText}`);

        // Only explicit invalid-token responses should clear credentials. A 403 or 429 can be a transient WAF or rate-limit response.
        error.isAuthError = resp.status === 400 || resp.status === 401;
        throw error;
    }

    const data = await resp.json();
    if (data && data.error) {
        // GitHub returns OAuth errors (e.g. bad_refresh_token) in the response body
        const error = new Error(`Refresh failed: ${data.error_description || data.error}`);
        error.isAuthError = true;
        throw error;
    }
    if (!data || !data.access_token || !data.refresh_token) {
        throw new Error('Invalid refresh response: missing access_token or refresh_token');
    }

    return data;
}

/**
 * Request a valid access token from the background script. The background owns
 * credential storage and OAuth refresh coordination.
 * @param {boolean} forceRefresh Whether the background should refresh an OAuth token
 * @param {string} rejectedToken Token rejected by GitHub, if any
 * @returns {Promise<Object>} Valid access token and authentication type
 */
function getValidGitHubToken(forceRefresh = false, rejectedToken = null) {
    if (inflightTokenPromise && !forceRefresh) {
        return inflightTokenPromise;
    }

    const tokenPromise = sendAuthMessage({
        action: 'get-valid-github-token',
        forceRefresh,
        rejectedToken,
    });
    const sharedTokenPromise = tokenPromise.finally(() => {
        if (inflightTokenPromise !== sharedTokenPromise) {
            return;
        }
        inflightTokenPromise = null;
    });
    inflightTokenPromise = sharedTokenPromise;

    return inflightTokenPromise;
}

/**
 * Extract error from callback URL
 * @param {string} url - Callback URL from OAuth flow
 * @returns {string|null} Error message
 */
function extractErrorFromUrl(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    return error ? `${error}: ${errorDescription || 'Unknown error'}` : null;
}

/**
 * Extract query param value from a URL
 * @param {string} url
 * @param {string} key
 * @returns {string|null}
 */
function getQueryParam(url, key) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get(key);
}

/**
 * Exchange code for token via worker without relying on cookies
 * @param {string} code\
 * @param {string} redirectUri
 * @returns {Promise<Object>} Token data
 */
async function exchangeCodeViaWorker(code, redirectUri) {
    try {
        const response = await fetch(`${GITHUB_OAUTH_CONFIG.APP_OAUTH_URL}/oauth/github/exchange`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            throw new Error(`Worker exchange failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || data.error) {
            const detail = data && (data.error_description || data.detail || data.error);
            throw new Error(`OAuth error: ${detail || 'Unknown error'}`);
        }

        if (!data.access_token || !data.refresh_token) {
            throw new Error('No access token or refresh token received from worker');
        }

        return {...data};
    } catch (error) {
        throw new Error(`Token retrieval failed: ${error.message}`);
    }
}

/**
 * Handle OAuth flow using the browser identity API
 * @returns {Promise<Object>} OAuth result
 */
function handleOAuthFlow() {
    return new Promise((resolve, reject) => {
        if (
            !ksBrowser.identity ||
            !ksBrowser.identity.launchWebAuthFlow ||
            !ksBrowser.identity.getRedirectURL
        ) {
            reject(new Error('Browser identity API not available'));
            return;
        }

        // Compute extension redirect URL for this browser
        const redirectUri = ksBrowser.identity.getRedirectURL();

        // Generate state and construct authorize URL
        const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const authorize = new URL('https://github.com/login/oauth/authorize');
        authorize.searchParams.set('client_id', GITHUB_OAUTH_CONFIG.CLIENT_ID);
        authorize.searchParams.set('redirect_uri', redirectUri);
        authorize.searchParams.set('state', state);
        authorize.searchParams.set('allow_signup', 'true');

        ksBrowser.identity.launchWebAuthFlow(
            {
                url: authorize.toString(),
                interactive: true,
            },
            redirectedTo => {
                // Handle errors from the identity flow
                if (ksBrowser.runtime && ksBrowser.runtime.lastError) {
                    reject(new Error(ksBrowser.runtime.lastError.message));
                    return;
                }
                if (!redirectedTo) {
                    reject(new Error('No redirect URL returned'));
                    return;
                }

                // Check for error in redirect
                const err = extractErrorFromUrl(redirectedTo);
                if (err) {
                    reject(new Error(`OAuth error: ${err}`));
                    return;
                }

                // Validate state then exchange code via worker endpoint
                const returnedState = getQueryParam(redirectedTo, 'state');
                if (!returnedState || returnedState !== state) {
                    reject(new Error('Invalid OAuth state'));
                    return;
                }
                const code = getQueryParam(redirectedTo, 'code');
                if (!code) {
                    reject(new Error('No authorization code received'));
                    return;
                }

                exchangeCodeViaWorker(code, redirectUri)
                    .then(tokenData => {
                        resolve({success: true, tokenData});
                    })
                    .catch(tokenError => {
                        reject(new Error(`${tokenError.message}`));
                    });
            },
        );
    });
}

export {
    GITHUB_AUTH_STORAGE_KEY,
    LEGACY_OAUTH_STORAGE_KEY,
    clearGitHubAuth,
    getAuthState,
    getValidGitHubToken,
    initiateOAuth,
    isOAuthAvailable,
    migrateLegacyAuth,
    onAuthStateChange,
    handleOAuthFlow,
    refreshToken,
};
