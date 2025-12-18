import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

let ghToken;
let useStaticTimestamps;
ReactNativeOnyx.connect({
    key: ONYXKEYS.PREFERENCES,
    callback: (preferences) => {
        // Make sure they have entered their API token
        if (!preferences) {
            return;
        }

        ghToken = preferences.ghToken;
        useStaticTimestamps = preferences.useStaticTimestamps || false;
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
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {ghToken: value});
}

function getUseStaticTimestamps() {
    return useStaticTimestamps || false;
}

/**
 * @param {Boolean} value
 */
function setUseStaticTimestamps(value) {
    useStaticTimestamps = value;
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {useStaticTimestamps: value});
}

export {
    getGitHubToken,
    setGitHubToken,
    getUseStaticTimestamps,
    setUseStaticTimestamps,
};
