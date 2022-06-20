import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';

function getAssigned() {
    API.getPullsByType('assignee')
        .then((prs) => {
            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.PRS.ASSIGNED, prs);
        });
}

function getAuthored() {
    API.getPullsByType('author')
        .then((prs) => {
            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.PRS.AUTHORED, prs);
        });
}

function getReviewing() {
    // @TODO also need to combine this with reviewed-by
    API.getPullsByType('review-requested');
    API.getPullsByType('reviewed-by')
        .then((prs) => {
            // Always use set() here because there is no way to remove issues from Onyx
            // that get closed and are no longer assigned
            ReactNativeOnyx.set(ONYXKEYS.PRS.REVIEWING, prs);
        });
}

export {
    getAssigned,
    getAuthored,
    getReviewing,
};
