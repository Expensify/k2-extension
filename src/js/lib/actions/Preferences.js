import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

let ghToken;
let useAbsoluteTimestamps;
ReactNativeOnyx.connect({
    key: ONYXKEYS.PREFERENCES,
    callback: (preferences) => {
        // Make sure they have entered their API token
        if (!preferences) {
            return;
        }

        ghToken = preferences.ghToken;
        useAbsoluteTimestamps = !!preferences.useAbsoluteTimestamps;
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

function getUseAbsoluteTimestamps() {
    return !!useAbsoluteTimestamps;
}

/**
 * @param {Boolean} value
 */
function setUseAbsoluteTimestamps(value) {
    useAbsoluteTimestamps = value;
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {useAbsoluteTimestamps: value});
}

export {
    getGitHubToken,
    setGitHubToken,
    getUseAbsoluteTimestamps,
    setUseAbsoluteTimestamps,
};
