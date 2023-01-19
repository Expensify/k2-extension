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
        this.state = {shouldShowAllWAQIssues: true};

        this.fetch = this.fetch.bind(this);
        this.filterByCurrentUser = this.filterByCurrentUser.bind(this);
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

    filterByCurrentUser(issue) {
        return !this.state.shouldShowAllWAQIssues && _.findWhere(issue.assignees, {login: `${API.getCurrentUser()}`});
    }

    toggleWAQFilter() {
        this.setState(prevState => ({shouldShowAllWAQIssues: !prevState.shouldShowAllWAQIssues}));
    }

    render() {
        // The WAQ issues need to be grouped according to how old they are
        const issuesYoungerThanOneWeek = {};
        const issuesOneWeekOld = {};
        const issuesTwoWeeksOld = {};
        const issuesThreeWeeksOld = {};
        const issuesFourWeeksOld = {};
        const issuesOlderThanFourWeeks = {};

        _.each(this.props.issues, (issue, issueID) => {
            const ageInWeeks = moment().diff(issue.createdAt, 'weeks');
            switch (ageInWeeks) {
                case 0:
                    issuesYoungerThanOneWeek[issueID] = issue;
                    break;
                case 1:
                    issuesOneWeekOld[issueID] = issue;
                    break;
                case 2:
                    issuesTwoWeeksOld[issueID] = issue;
                    break;
                case 3:
                    issuesThreeWeeksOld[issueID] = issue;
                    break;
                case 4:
                    issuesFourWeeksOld[issueID] = issue;
                    break;
                default:
                    issuesOlderThanFourWeeks[issueID] = issue;
                    break;
            }
        });

        const issueCount = this.props.issues && _.size(this.props.issues);

        return (
            <div className="panel mb-3">
                <Title text={`WAQ ${issueCount ? `(${issueCount})` : ''}`} />

                <div className="checkbox">
                    <label>
                        <input type="checkbox" name="shouldShowAllWAQIssues" onChange={this.toggleWAQFilter} />
                        {' '}
                        Show All WAQ issues
                    </label>
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
                        <Title text={`Older than 4 Weeks (${_.size(issuesOlderThanFourWeeks)})`} />
                        {_.chain(issuesOlderThanFourWeeks)
                            .sortBy('updatedAt')
                            .map(issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)
                            .value()
                            .reverse()}

                        <Title text={`4 Weeks Old (${_.size(issuesFourWeeksOld)})`} />
                        {_.chain(issuesFourWeeksOld)
                            .sortBy('updatedAt')
                            .map(issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)
                            .value()
                            .reverse()}

                        <Title text={`3 Weeks Old (${_.size(issuesThreeWeeksOld)})`} />
                        {_.chain(issuesThreeWeeksOld)
                            .sortBy('updatedAt')
                            .map(issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)
                            .value()
                            .reverse()}

                        <Title text={`2 Weeks Old (${_.size(issuesTwoWeeksOld)})`} />
                        {_.chain(issuesTwoWeeksOld)
                            .sortBy('updatedAt')
                            .map(issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)
                            .value()
                            .reverse()}

                        <Title text={`1 Week Old (${_.size(issuesOneWeekOld)})`} />
                        {_.chain(issuesOneWeekOld)
                            .sortBy('updatedAt')
                            .map(issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)
                            .value()
                            .reverse()}

                        <Title text={`Younger than 1 week (${_.size(_.filter(issuesYoungerThanOneWeek, this.filterByCurrentUser))})`} />
                        {_.chain(issuesYoungerThanOneWeek)
                            .filter(this.filterByCurrentUser)
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
