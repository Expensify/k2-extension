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
    const promises = [];
    promises.push(API.getPullsByType('review-requested'));
    promises.push(API.getPullsByType('reviewed-by'));

    Promise.all(promises).then((values) => {
        const allPRs = {
            ...values[0],
            ...values[1],
        };
        // Always use set() here because there is no way to remove issues from Onyx
        // that get closed and are no longer assigned
        ReactNativeOnyx.set(ONYXKEYS.PRS.REVIEWING, allPRs);
    });
}

export {
    getAssigned,
    getAuthored,
    getReviewing,
};
