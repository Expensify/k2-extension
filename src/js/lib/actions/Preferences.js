import ReactNativeOnyx from 'react-native-onyx';

function setGitHubToken(token) {
    ReactNativeOnyx.merge('preferences', {ghToken: token});
}

export {
    // eslint-disable-next-line import/prefer-default-export
    setGitHubToken,
};
