import $ from 'jquery';
import alt from '../alt';
import * as API from '../lib/api';

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

        API.getEngineeringIssues((err, data) => {
            if (err) {
                return this.actions.failed(err);
            }

            // Update the tab counter
            $('[data-key="core"] .counter').html(data.length);

            this.actions.update(data);
        }, (data) => {
            // console.log('hit the retryCb')
            this.actions.retry(data);
        });
    }
}

export default alt.createActions(Action);
