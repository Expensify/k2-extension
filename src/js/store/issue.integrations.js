import alt from '../alt';
import IssueAction from '../action/issue.integrations';
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

module.exports = alt.createStore(Store, 'IssueStoreIntegrations');
