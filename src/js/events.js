import * as messenger from './lib/messenger';
import * as GitHubOAuth from './lib/GitHubOAuth';
import ksBrowser from './lib/browser';

// Start navigation event publisher
messenger.startNavEventPublisher();

// Listen for oauth events from the content script.
// The background script is a stateless network proxy: it performs the OAuth
// network calls (which can't run in the content script due to CSP) and returns
// the token data to the content script, which owns all storage. This means it
// doesn't matter that the MV3 service worker suspends when idle - it's woken
// by each message and holds no state.
ksBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'initiate-oauth') {
        GitHubOAuth.handleOAuthFlow()
            .then((result) => {
                sendResponse(result);
            })
            .catch((error) => {
                sendResponse({success: false, error: error.message});
            });

        // Let the runtime know we'll send a response asynchronously
        return true;
    }

    if (request.action === 'refresh-token') {
        GitHubOAuth.refreshToken(request.refreshToken)
            .then((tokenData) => {
                sendResponse({success: true, tokenData});
            })
            .catch((error) => {
                sendResponse({success: false, error: error.message, isAuthError: !!error.isAuthError});
            });

        // Let the runtime know we'll send a response asynchronously
        return true;
    }

    return false;
});
