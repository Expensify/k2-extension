'use strict';

let alt = require('../alt');
let IssueAction = require('../action/pull.reviewing');
let BaseIssueStore = require('./_issue');

class Store extends BaseIssueStore {
  constructor() {
    super();

    this.bindListeners({
      handleUpdate: IssueAction.UPDATE,
      handleFetch: IssueAction.FETCH,
      handleFailed: IssueAction.FAILED
    });
  }
}

module.exports = alt.createStore(Store, 'PullStoreReviewing');
