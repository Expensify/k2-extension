import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

function save(filters) {
    ReactNativeOnyx.merge(ONYXKEYS.ISSUES.FILTER, filters);
}

export {
    // eslint-disable-next-line import/prefer-default-export
    save,
};
