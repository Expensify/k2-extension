import alt from '../alt';
import IssueAction from '../action/dailyimprovements';
import BaseIssueStore from './_issue';

class Store extends BaseIssueStore {
    constructor() {
        super();

        this.bindListeners({
            handleUpdate: IssueAction.UPDATE,
            handleFetch: IssueAction.FETCH,
            handleFailed: IssueAction.FAILED,
        });
    }
}

export default alt.createStore(Store, 'DailyImprovements');
