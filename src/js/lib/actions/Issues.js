import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';

function getAllAssigned() {
    API.getIssuesAssigned()
        .then((issues) => {
            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.ISSUES.ASSIGNED, issues);
        });
}

function getEngineering() {
    API.getEngineeringIssues('engineering', (err, issues) => {
        if (err) {
            return;
        }
        // Always use set() here because there is no way to remove issues from Onyx
        // that have the engineering label removed
        ReactNativeOnyx.set(ONYXKEYS.ISSUES.ASSIGNED, issues);
    }, () => {});
}

export {
    getAllAssigned,
    getEngineering,
};
