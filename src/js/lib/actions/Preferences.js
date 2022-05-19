import ReactNativeOnyx from 'react-native-onyx';

let ghToken;
ReactNativeOnyx.connect({
    key: 'preferences',
    callback: (preferences) => {
        // Make sure they have entered their API token
        if (!preferences) {
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
    ghToken = value;
    ReactNativeOnyx.merge('preferences', {ghToken: value});
}

export {
    getGitHubToken,
    setGitHubToken,
};
