'use strict';

let alt = require('../alt');
let IssueAction = require('../action/issue.core');
let BaseIssueStore = require('./_issue');

class Store extends BaseIssueStore {
  constructor() {
    super();

    this.bindListeners({
      handleUpdate: IssueAction.UPDATE,
      handleFetch: IssueAction.FETCH,
      handleFailed: IssueAction.FAILED,
      handleRetry: IssueAction.RETRY
    });
  }
}

module.exports = alt.createStore(Store, 'IssueStoreCore');
