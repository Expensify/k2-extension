'use strict';

let alt = require('../alt');
let API = require('../lib/api');

class Action {
  update(data) {
    this.dispatch(data);
  }
  failed(msg) {
    this.dispatch(msg);
  }
  fetch() {
    this.dispatch();

    API.getPullsReviewing((err, data) => {
      if (err) {
        return this.actions.failed(err);
      }
      this.actions.update(data);
    });
  }
}

module.exports = alt.createActions(Action);
