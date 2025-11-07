import * as messenger from './lib/messenger';
import * as GitHubOAuth from './lib/GitHubOAuth';
import ksBrowser from './lib/browser';

// Start navigation event publisher
messenger.startNavEventPublisher();

// Listen for oauth events from the content script
ksBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action !== 'initiate-oauth') {
        return false;
    }

    GitHubOAuth.handleOAuthFlow()
        .then((result) => {
            sendResponse(result);
        })
        .catch((error) => {
            sendResponse({success: false, error: error.message});
        });

    // Let the runtime know we'll send a response asynchronously
    return true;
});
