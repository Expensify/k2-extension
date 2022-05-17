import ReactNativeOnyx from 'react-native-onyx/web';

let ghToken;
ReactNativeOnyx.connect({
    key: 'preferences',
    callback: (preferences) => {
        // Make sure they have entered their API token
        if (!preferences || !preferences.ghToken) {
            return;
        }

        ghToken = preferences.ghToken;
    },
});

function getGitHubToken() {
    return ghToken;
}

/**
 * @param {String} value
 */
function setGitHubToken(value) {
    ReactNativeOnyx.merge('preferences', {ghToken: value});
}

export {
    getGitHubToken,
    setGitHubToken,
};
