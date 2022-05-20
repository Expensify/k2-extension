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

        API.getAllAssigned()
            .then(this.actions.update)
            .catch(this.actions.failed);
    }
}

export default alt.createActions(Action);
