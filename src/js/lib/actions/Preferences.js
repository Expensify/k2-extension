import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

let ghToken;
let useAbsoluteTimestamps;
let k2RepoUrl;
ReactNativeOnyx.connect({
    key: ONYXKEYS.PREFERENCES,
    callback: (preferences) => {
        // Make sure they have entered their API token
        if (!preferences) {
            return;
        }

        ghToken = preferences.ghToken;
        useAbsoluteTimestamps = !!preferences.useAbsoluteTimestamps;
        k2RepoUrl = preferences.k2RepoUrl || null;
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
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {
        useAbsoluteTimestamps: value,
    });
}

function getK2RepoUrl() {
    return k2RepoUrl;
}

/**
 * @param {String} value
 */
function setK2RepoUrl(value) {
    k2RepoUrl = value;
    ReactNativeOnyx.merge(ONYXKEYS.PREFERENCES, {k2RepoUrl: value});
}

export {
    getGitHubToken,
    setGitHubToken,
    getUseAbsoluteTimestamps,
    setUseAbsoluteTimestamps,
    getK2RepoUrl,
    setK2RepoUrl,
};
