import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';

function get() {
    API.getMilestones()
        .then((milestones) => {
            // Always use set() here because there is no way to remove milestones from Onyx that get closed
            ReactNativeOnyx.set(ONYXKEYS.MILESTONES, milestones);
        });
}

export {
    // eslint-disable-next-line import/prefer-default-export
    get,
};
