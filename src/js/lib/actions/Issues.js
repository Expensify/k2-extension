import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';

function getAllAssigned() {
    API.getAllAssigned()
        .then((issues) => {
            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.ASSIGNED_ISSUES, issues);
        });
}

export {
    // eslint-disable-next-line import/prefer-default-export
    getAllAssigned,
};
