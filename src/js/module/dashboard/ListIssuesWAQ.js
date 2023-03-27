import React from 'react';
import _ from 'underscore';
import moment from 'moment';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import Title from '../../component/panel-title/Title';
import ListItemIssue from '../../component/list-item/ListItemIssue';
import * as Issues from '../../lib/actions/Issues';
import * as API from '../../lib/api';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** All the WAQ issues */
    issues: PropTypes.objectOf(IssuePropTypes),
};
const defaultProps = {
    issues: null,
};

class ListIssuesWAQ extends React.Component {
    constructor(props) {
        super(props);

        // By default show only issues assigned to the current user
        this.state = {shouldShowAllWAQIssues: false};
        this.fetch = this.fetch.bind(this);
        this.shouldDisplayIssue = this.shouldDisplayIssue.bind(this);
        this.toggleWAQFilter = this.toggleWAQFilter.bind(this);
    }

    componentDidMount() {
        this.fetch();
    }

    componentWillUnmount() {
        if (!this.interval) {
            return;
        }
        clearInterval(this.interval);
    }

    fetch() {
        Issues.getWAQ();

        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    shouldDisplayIssue(issue) {
        if (this.state.shouldShowAllWAQIssues) {
            return true;
        }
        return _.findWhere(issue.assignees, {login: `${API.getCurrentUser()}`});
    }

    toggleWAQFilter() {
        this.setState(prevState => ({shouldShowAllWAQIssues: !prevState.shouldShowAllWAQIssues}));
    }

    render() {
        // The WAQ issues need to be grouped according to how old they are
        const issuesYoungerThanOneWeek = {};
        const issuesOlderThanOneWeek = {};
        const issuesOlderThanTwoWeeks = {};
        const issuesOlderThanThreeWeeks = {};
        const issuesOlderThanFourWeeks = {};
        let issueCount = 0;

        _.each(this.props.issues, (issue, issueID) => {
            if (!this.shouldDisplayIssue(issue)) {
                return;
            }
            issueCount++;
            const ageInWeeks = moment().diff(issue.createdAt, 'weeks');
            switch (ageInWeeks) {
                case 0:
                    issuesYoungerThanOneWeek[issueID] = issue;
                    break;
                case 1:
                    issuesOlderThanOneWeek[issueID] = issue;
                    break;
                case 2:
                    issuesOlderThanTwoWeeks[issueID] = issue;
                    break;
                case 3:
                    issuesOlderThanThreeWeeks[issueID] = issue;
                    break;
                default:
                    issuesOlderThanFourWeeks[issueID] = issue;
                    break;
            }
        });

        const waqPanelTitle = this.state.shouldShowAllWAQIssues ? 'All WAQ' : 'WAQ assigned to me';

        return (
            <div className="panel waq mb-3">
                <div className="d-flex flex-row">
                    <div className="col-6">
                        <h3 className="panel-title">{`${waqPanelTitle} ${issueCount ? ` (${issueCount})` : '(0)'}`}</h3>
                    </div>
                    <div className="col-6 panel-title">
                        <form className="form-inline">
                            <div className="checkbox">
                                <label>
                                    <input type="checkbox" name="shouldShowAllWAQIssues" id="shouldShowAllWAQIssues" onChange={this.toggleWAQFilter} />
                                    Show All WAQ issues
                                </label>
                            </div>
                        </form>
                    </div>
                </div>

                {!this.props.issues && (
                    <div className="blankslate capped clean-background">
                        Loading
                    </div>
                )}

                {!issueCount ? (
                    <div className="blankslate capped clean-background">
                        No items
                    </div>
                ) : (
                    <>
                        <Title text="🔴 Older than 4 weeks" count={_.size(issuesOlderThanFourWeeks)} />
                        {_.chain(issuesOlderThanFourWeeks)
                            .sortBy('updatedAt')
                            .map(issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)
                            .value()
                            .reverse()}

                        <Title text="Older than 3 weeks" count={_.size(issuesOlderThanThreeWeeks)} />
                        {_.chain(issuesOlderThanThreeWeeks)
                            .sortBy('updatedAt')
                            .map(issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)
                            .value()
                            .reverse()}

                        <Title text="Older than 2 weeks" count={_.size(issuesOlderThanTwoWeeks)} />
                        {_.chain(issuesOlderThanTwoWeeks)
                            .sortBy('updatedAt')
                            .map(issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)
                            .value()
                            .reverse()}

                        <Title text="Older than 1 week" count={_.size(issuesOlderThanOneWeek)} />
                        {_.chain(issuesOlderThanOneWeek)
                            .sortBy('updatedAt')
                            .map(issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)
                            .value()
                            .reverse()}

                        <Title text="Younger than 1 week" count={_.size(issuesYoungerThanOneWeek)} />
                        {_.chain(issuesYoungerThanOneWeek)
                            .sortBy('updatedAt')
                            .map(issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)
                            .value()
                            .reverse()}

                    </>
                )}

            </div>
        );
    }
}

ListIssuesWAQ.propTypes = propTypes;
ListIssuesWAQ.defaultProps = defaultProps;

export default withOnyx({
    issues: {
        key: ONYXKEYS.ISSUES.WAQ,
    },
})(ListIssuesWAQ);
