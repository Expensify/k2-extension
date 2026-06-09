import * as Preferences from './actions/Preferences';
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

// Refresh window (ms) before expiry to proactively refresh
const REFRESH_SKEW_MS = 5 * 60 * 1000;

// Tracks an in-flight refresh so concurrent callers share a single request.
// GitHub App refresh tokens are single-use, so two parallel refreshes would
// invalidate the session.
let inflightRefreshPromise = null;

/**
 * Initiate OAuth flow with GitHub using background script
 * @returns {Promise<string>} OAuth token
 */
function initiateOAuth() {
    return new Promise((resolve, reject) => {
        if ((!ksBrowser) || !ksBrowser.runtime) {
            reject(new Error('Chrome runtime API not available'));
            return;
        }

        // Send message to background script to handle OAuth
        ksBrowser.runtime.sendMessage(
            {action: 'initiate-oauth'},
            (response) => {
                if (ksBrowser.runtime.lastError) {
                    reject(new Error(ksBrowser.runtime.lastError.message));
                    return;
                }

                if (!response) {
                    reject(new Error('No response from background script'));
                    return;
                }

                if (!response.success) {
                    reject(new Error(response.error || 'OAuth failed'));
                    return;
                }

                try {
                    // Store OAuth data from background script response
                    const tokenData = response.tokenData;
                    if (!tokenData || !tokenData.access_token) {
                        reject(new Error('Invalid token data received'));
                        return;
                    }

                    Preferences.setAuthData({
                        type: 'oauth',
                        token: tokenData.access_token,
                        refreshToken: tokenData.refresh_token,
                        expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : null,
                    });

                    resolve(tokenData.access_token);
                } catch (error) {
                    reject(new Error(`Failed to store OAuth data: ${error.message}`));
                }
            },
        );
    });
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
 * it does NOT touch storage, because it runs in the background script context,
 * which does not share an Onyx store with the content script. The caller (content
 * script) is responsible for persisting the returned token data.
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

        // A 4xx from the worker means the refresh token was rejected
        error.isAuthError = resp.status >= 400 && resp.status < 500;
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
 * Refresh token via background script (for content script context).
 * The background script only performs the network call (to avoid CSP issues);
 * the new token data is persisted here, in the content script context, which
 * owns the Onyx store.
 *
 * Concurrent callers share a single in-flight refresh.
 *
 * @returns {Promise<string>} New access token
 */
function refreshTokenViaBackground() {
    if (inflightRefreshPromise) {
        return inflightRefreshPromise;
    }

    inflightRefreshPromise = new Promise((resolve, reject) => {
        if ((!ksBrowser) || !ksBrowser.runtime || !ksBrowser.runtime.sendMessage) {
            reject(new Error('Browser runtime API not available'));
            return;
        }

        const authData = Preferences.getAuthData();
        const refreshTokenValue = authData && authData.refreshToken;
        if (!refreshTokenValue) {
            reject(new Error('No refresh token available'));
            return;
        }

        // Send message to background script to perform the network refresh.
        // Receiving the message also wakes the service worker if it was suspended.
        ksBrowser.runtime.sendMessage(
            {action: 'refresh-token', refreshToken: refreshTokenValue},
            (response) => {
                if (ksBrowser.runtime.lastError) {
                    reject(new Error(ksBrowser.runtime.lastError.message));
                    return;
                }

                if (!response) {
                    reject(new Error('No response from background script'));
                    return;
                }

                if (!response.success) {
                    // Only sign the user out when the refresh token itself was
                    // rejected. Transient network errors keep credentials so we
                    // can retry later.
                    if (response.isAuthError) {
                        Preferences.clearAuth();
                    }
                    reject(new Error(response.error || 'Refresh failed'));
                    return;
                }

                const tokenData = response.tokenData;
                if (!tokenData || !tokenData.access_token || !tokenData.refresh_token) {
                    reject(new Error('Invalid token data received from background script'));
                    return;
                }

                Preferences.setAuthData({
                    type: 'oauth',
                    token: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : null,
                });

                resolve(tokenData.access_token);
            },
        );
    });

    // Always clear the in-flight marker once settled
    inflightRefreshPromise = inflightRefreshPromise.finally(() => {
        inflightRefreshPromise = null;
    });

    return inflightRefreshPromise;
}

/**
 * Determine if token should be refreshed (expired or within skew)
 * @returns {boolean}
 */
function shouldRefresh() {
    const authData = Preferences.getAuthData();
    if (!authData || authData.type !== 'oauth' || !authData.token || !authData.refreshToken) {
        return false;
    }
    if (!authData.expiresAt) {
        return false;
    }
    return (Date.now() + REFRESH_SKEW_MS) >= authData.expiresAt;
}

/**
 * Attempt to refresh token if needed. Safe to call often (startup, tab focus,
 * before API calls): it no-ops unless the token is expired or about to expire,
 * and concurrent calls share a single refresh.
 * @returns {Promise<void>}
 */
async function refreshIfNeeded() {
    try {
        if (shouldRefresh()) {
            await refreshTokenViaBackground();
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Token refresh failed', e);
    }
}

/**
 * Force refresh token regardless of expiry (testing hook)
 * @returns {Promise<string>} New access token
 */
async function forceRefresh() {
    try {
        return await refreshTokenViaBackground();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Token refresh failed', e);
        throw e;
    }
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
        if (!ksBrowser.identity || !ksBrowser.identity.launchWebAuthFlow || !ksBrowser.identity.getRedirectURL) {
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

        ksBrowser.identity.launchWebAuthFlow({
            url: authorize.toString(),
            interactive: true,
        }, (redirectedTo) => {
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
                .then((tokenData) => {
                    resolve({success: true, tokenData});
                })
                .catch((tokenError) => {
                    reject(new Error(`${tokenError.message}`));
                });
        });
    });
}

/**
 * Revoke OAuth token
 * @returns {Promise<void>}
 */
async function revokeToken() {
    const token = Preferences.getGitHubToken();
    if (!token || Preferences.getAuthType() !== 'oauth') {
        return;
    }

    try {
        await fetch(`https://api.github.com/applications/${GITHUB_OAUTH_CONFIG.CLIENT_ID}/token`, {
            method: 'DELETE',
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
                access_token: token,
            }),
        });
    } finally {
        Preferences.clearAuth();
    }
}

export {
    initiateOAuth,
    isOAuthAvailable,
    revokeToken,
    handleOAuthFlow,
    refreshIfNeeded,
    refreshToken,
    refreshTokenViaBackground,
    forceRefresh,
};
