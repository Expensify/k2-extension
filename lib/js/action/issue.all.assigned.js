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
    this.dispatch(data);
  }
  fetch() {
    this.dispatch();

    API.getAllAssigned((err, data) => {
      if (err) {
        return this.actions.failed(err);
      }

      this.actions.update(data);
    }, (data) => {
      this.actions.retry(data);
    });
  }
}

module.exports = alt.createActions(Action);
