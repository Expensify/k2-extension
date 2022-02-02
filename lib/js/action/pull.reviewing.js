
const _ = require('underscore');
const alt = require('../alt');
const API = require('../lib/api');

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
            let filtered;
            let uniqueData;
            if (err) {
                return this.actions.failed(err);
            }
            filtered = data.filter(pr =>

            // Filter out non expensify prs
                pr.url.includes('Expensify'));

            // Dedupe the results, it's possible that a PR
            // shows up twice, one from "reviewed-by"
            // and once in "review-requested" results
            uniqueData = _.uniq(filtered, pr => pr.id);
            this.actions.update(uniqueData);
        });
    }
}

module.exports = alt.createActions(Action);
