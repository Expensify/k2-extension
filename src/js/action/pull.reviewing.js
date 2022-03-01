import _ from 'underscore';
import alt from '../alt';
import * as API from '../lib/api';

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

            // Filter out non expensify prs
            const expensifyOnlyPRs = _.filter(data, pr => pr.url.includes('Expensify'));

            // Dedupe the results, it's possible that a PR
            // shows up twice, one from "reviewed-by"
            // and once in "review-requested" results
            const uniqueData = _.uniq(expensifyOnlyPRs, pr => pr.id);

            if (uniqueData.length > 0) {
                this.actions.update(uniqueData);
            }
        });
    }
}

export default alt.createActions(Action);
