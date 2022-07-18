import React from 'react';
import PropTypes from 'prop-types';
import * as prefs from '../../lib/prefs';
import Filters from './Filters';

import ListIssuesAssigned from './ListIssuesAssigned';
import * as Preferences from '../../lib/actions/Preferences';
import ListPRsAssigned from './ListPRsAssigned';
import ListPRsReviewing from './ListPRsReviewing';
import ListIssuesEngineering from './ListIssuesEngineering';
import ListIssuesDailyImprovements from './ListIssuesDailyImprovements';
import Legend from './Legend';

const propTypes = {
    /** The number of seconds to refresh the list of issues */
    pollInterval: PropTypes.number.isRequired,
};

class ListIssues extends React.Component {
    constructor(props) {
        super(props);

        this.signOut = this.signOut.bind(this);
    }

    /**
     * Sign out the user so they are prompted for their API token again
     */
    signOut() {
        prefs.clear('ghToken');
        Preferences.setGitHubToken('');
        window.location.reload();
    }

    render() {
        return (
            <div className="issueList">
                <Legend onSignOut={this.signOut} />

                <ListIssuesAssigned pollInterval={this.props.pollInterval} />

                <ListIssuesDailyImprovements pollInterval={this.props.pollInterval * 2.5} />

                <ListPRsAssigned pollInterval={this.props.pollInterval * 2.5} />

                <ListPRsReviewing pollInterval={this.props.pollInterval * 2.5} />

                <Filters />

                <ListIssuesEngineering pollInterval={this.props.pollInterval * 2.5} />
            </div>
        );
    }
}

ListIssues.propTypes = propTypes;

export default ListIssues;
