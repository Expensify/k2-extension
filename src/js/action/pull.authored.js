import alt from '../alt';

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

        API.getPullsAuthored((err, data) => {
            if (err) {
                return this.actions.failed(err);
            }

            this.actions.update(data);
        });
    }
}

export default alt.createActions(Action);
