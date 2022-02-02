
const alt = require('../alt');
const IssueAction = require('../action/pull.authored');
const BaseIssueStore = require('./_issue');

class Store extends BaseIssueStore {
    constructor() {
        super();

        this.bindListeners({
            handleUpdate: IssueAction.UPDATE,
            handleFetch: IssueAction.FETCH,
            handleFailed: IssueAction.FAILED,
        });
    }
}

module.exports = alt.createStore(Store, 'PullStoreAuthored');
