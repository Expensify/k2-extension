'use strict';
let alreadyFetched = false;

class BaseStore {
  constructor() {
    this.loading = false;
    this.retrying = false;
    this.data = [];
    this.errorMessage = null;
  }
  handleFetch() {
    if (!alreadyFetched) {
      this.loading = true;
      this.retrying = false;
      this.data = [];
      alreadyFetched = true;
    }
  }
  handleUpdate(data) {
    this.loading = false;
    this.retrying = false;
    this.data = data;
  }
  handleFailed(msg) {
    this.loading = false;
    this.retrying = false;
    this.errorMessage = msg;
  }
  handleRetry(data) {
    this.loading = false;
    this.retrying = true;
  }
}

module.exports = BaseStore;
