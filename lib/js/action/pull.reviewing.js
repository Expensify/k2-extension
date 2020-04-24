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
      var filtered;
      var lastItem;
      if (err) {
        return this.actions.failed(err);
      }
      filtered = data.filter((pr) => {
        // Dedupe the results, it's possible that a PR
        // shows up twice, one from "reviewed-by"
        // and once in "review-requested" results
        if (lastItem && pr.id === lastItem.id) {
          lastItem = pr;
          return false;
        }

        // Filter out non expensify prs
        lastItem = pr;
        return pr.url.includes('Expensify');
      });
      this.actions.update(filtered);
    });
  }
}

module.exports = alt.createActions(Action);
