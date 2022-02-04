import alt from '../alt';
import IssueAction from '../action/issue.core';
import BaseIssueStore from './_issue';

class Store extends BaseIssueStore {
    constructor() {
        super();

        this.bindListeners({
            handleUpdate: IssueAction.UPDATE,
            handleFetch: IssueAction.FETCH,
            handleFailed: IssueAction.FAILED,
            handleRetry: IssueAction.RETRY,
        });
    }
}

export default alt.createStore(Store, 'IssueStoreCore');
