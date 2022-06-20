import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';

function getAssigned() {
    API.getPullsByType('assignee');
}

function getAuthored() {
    API.getPullsByType('author');
}

function getReviewing() {
    // @TODO also need to combine this with reviewed-by
    API.getPullsByType('review-requested');
}

export {
    getAssigned,
    getAuthored,
    getReviewing,
};
