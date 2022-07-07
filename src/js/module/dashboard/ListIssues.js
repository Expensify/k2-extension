import React from 'react';
import PropTypes from 'prop-types';
import * as prefs from '../../lib/prefs';
import Filters from './Filters';

import StoreDailyImprovements from '../../store/dailyimprovements';
import ActionsDailyImprovements from '../../action/dailyimprovements';
import Issues from '../../lib/actions/Issues';
import PanelList from '../../component/panel/PanelList';
import ListIssuesAssigned from './ListIssuesAssigned';
import * as Preferences from '../../lib/actions/Preferences';
import ListPRsAssigned from './ListPRsAssigned';
import ListPRsReviewing from './ListPRsReviewing';
import ListIssuesEngineering from './ListIssuesEngineering';

const propTypes = {
    /** The number of seconds to refresh the list of issues */
    pollInterval: PropTypes.number.isRequired,
};

class ListIssues extends React.Component {
    constructor(props) {
        super(props);

        this.signOut = this.signOut.bind(this);
        this.filterIssues = this.filterIssues.bind(this);
    }

    /**
     * Sign out the user so they are prompted for their API token again
     */
    signOut() {
        prefs.clear('ghToken');
        Preferences.setGitHubToken('');
        window.location.reload(true);
    }

    render() {
        return (
            <div className="issueList">

                <div className="legend">
                    <button
                        type="button"
                        onClick={this.signOut}
                        className="btn tooltipped tooltipped-sw"
                        aria-label="Sign Out"
                    >
                        Sign Out
                    </button>
                    <br />
                    <br />
                    <a
                        className="btn btn-primary"
                        aria-label="New Issue"
                        href="https://github.com/Expensify/Expensify/issues/new/choose"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        New Issue
                    </a>

                    <br />
                    <div className="issue reviewing">Under Review</div>
                    <div className="issue overdue">Overdue</div>
                    <div className="issue planning">Planning</div>
                    <div className="issue contributor-assigned">Contributor Assigned</div>
                    <div className="issue">
                        <sup>E</sup>
                        {' '}
                        External
                    </div>
                    <div className="issue">
                        <sup>I</sup>
                        {' '}
                        Improvement
                    </div>
                    <div className="issue">
                        <sup>T</sup>
                        {' '}
                        Task
                    </div>
                    <div className="issue">
                        <sup>F</sup>
                        {' '}
                        New Feature
                    </div>
                    <div>
                        <span className="label hourly">H</span>
                        {' '}
                        Hourly
                    </div>
                    <div>
                        <span className="label daily">D</span>
                        {' '}
                        Daily
                    </div>
                    <div>
                        <span className="label weekly">W</span>
                        {' '}
                        Weekly
                    </div>
                    <div>
                        <span className="label monthly">M</span>
                        {' '}
                        Monthly
                    </div>
                    <div>
                        <span className="label newhire">FP</span>
                        {' '}
                        First Pick
                    </div>
                    <div>
                        <span className="label whatsnext">WN</span>
                        {' '}
                        WhatsNext
                    </div>
                </div>

                <ListIssuesAssigned
                    pollInterval={this.props.pollInterval}
                />

                <br />
                <div>
                    <PanelList
                        title="Daily Improvements (All Areas)"
                        action={ActionsDailyImprovements}
                        store={StoreDailyImprovements}
                        item="issue"
                        pollInterval={this.props.pollInterval * 1.6}
                    />
                </div>

                <ListPRsAssigned pollInterval={this.props.pollInterval * 2.5} />

                <ListPRsReviewing pollInterval={this.props.pollInterval * 2.5} />

                <Filters />

                <ListIssuesEngineering
                    pollInterval={this.props.pollInterval}
                />
            </div>
        );
    }
}

ListIssues.propTypes = propTypes;

export default ListIssues;
