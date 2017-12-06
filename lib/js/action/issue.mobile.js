'use strict';

const $ = require('jquery');
const alt = require('../alt');
const API = require('../lib/api');

class Action {
  update(data) {
    this.dispatch(data);
  }
  failed(msg) {
    this.dispatch(msg);
  }
  retry(data) {
    // console.log('retry()');
    this.dispatch(data);
  }
  fetch() {
    this.dispatch();

    API.getMobileIssues((err, data) => {
      if (err) {
        return this.actions.failed(err);
      }

      // Update the tab counter
      $('[data-key="mobile"] .counter').html(data.length);

      this.actions.update(data);
    }, (data) => {
      // console.log('hit the retryCb')
      this.actions.retry(data);
    });
  }
}

module.exports = alt.createActions(Action);
