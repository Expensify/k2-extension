import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

function togglePanel(panelID, hidden) {
    ReactNativeOnyx.set(`${ONYXKEYS.PANEL}${panelID}`, {
        isHidden: hidden,
    });
}

export {
    // eslint-disable-next-line import/prefer-default-export
    togglePanel,
};
