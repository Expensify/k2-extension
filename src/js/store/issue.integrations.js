import alt from '../alt';

const IssueAction = require('../action/issue.integrations');
const BaseIssueStore = require('./_issue');

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
