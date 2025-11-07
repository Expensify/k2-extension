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

        if (!data.token || !data.token.access_token) {
            throw new Error('No access token received from worker');
        }

        return data.token;
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
};
