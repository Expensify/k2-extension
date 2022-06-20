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

        API.getPullsAssigned()
            .then(data => this.actions.update(data));
    }
}

export default alt.createActions(Action);
