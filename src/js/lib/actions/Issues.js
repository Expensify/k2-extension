import ReactNativeOnyx from 'react-native-onyx';
import _ from 'underscore';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';

function getAllAssignedIssues() {
    API.getAllAssigned()
        .then((issues) => {
            const issuesToMerge = _.reduce(issues, (finalIssues, issue) => ({
                ...finalIssues,
                [`${ONYXKEYS.COLLECTION.ISSUE}${issue.id}`]: issue,
            }), {});
            ReactNativeOnyx.mergeCollection(ONYXKEYS.COLLECTION.ISSUE, issuesToMerge);
        });
}

export {
    // eslint-disable-next-line import/prefer-default-export
    getAllAssignedIssues,
};
