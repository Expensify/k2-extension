import React from 'react';
import PropTypes from 'prop-types';
import * as prefs from '../../lib/prefs';
import Filters from './Filters';
import Tabs from '../../component/tabs/Tabs';

import StoreIssueAssigned from '../../store/issue.all.assigned';
import StorePullAssigned from '../../store/pull.assigned';
import StorePullReviewing from '../../store/pull.reviewing';
import StoreDailyImprovements from '../../store/dailyimprovements';

import ActionsIssueAssigned from '../../action/issue.all.assigned';
import ActionsPullAssigned from '../../action/pull.assigned';
import ActionsPullReviewing from '../../action/pull.reviewing';
import ActionsDailyImprovements from '../../action/dailyimprovements';
import PanelList from '../../component/panel/PanelList';
import ListIssuesAssigned from './ListIssuesAssigned';

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
        window.location.reload(true);
    }

    filterIssues(filters) {
        this.tabs.refreshWithFilters(filters);
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
                    action={ActionsIssueAssigned}
                    store={StoreIssueAssigned}
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
                <br />
                <div>
                    <PanelList
                        title="Your Pull Requests"
                        action={ActionsPullAssigned}
                        store={StorePullAssigned}
                        item="pull"
                        pollInterval={this.props.pollInterval * 2}
                    />
                </div>
                <br />
                <div>
                    <PanelList
                        title="Review Requests - You need to finish reviewing"
                        action={ActionsPullReviewing}
                        store={StorePullReviewing}
                        item="pull"
                        pollInterval={this.props.pollInterval * 2.5}
                    />
                </div>
                <br />
                <Filters onChange={this.filterIssues} />
                <br />
                <div>
                    <Tabs
                        ref={el => this.tabs = el}
                        pollInterval={this.props.pollInterval * 3}
                        type="issue"
                        items={[
                            {
                                title: 'Engineering',
                                id: 'engineering',
                                apiMethod: 'getEngineeringIssues',
                            },
                            {
                                title: 'Integrations',
                                id: 'integrations',
                                apiMethod: 'getIntegrationsIssues',
                            },
                        ]}
                    />
                </div>
            </div>
        );
    }
}

ListIssues.propTypes = propTypes;

export default ListIssues;