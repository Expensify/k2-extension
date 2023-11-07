import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import IssuePropTypes from './IssuePropTypes';

const propTypes = {
    /** Information about the issue that is being displayed */
    issue: IssuePropTypes.isRequired,

    /** Whether or not the attendees should be shown */
    showAttendees: PropTypes.bool,
};
const defaultProps = {
    showAttendees: false,
};

class ListItemIssue extends React.Component {
    getClassName() {
        let className = 'issue';

        // See if it's under review
        if (this.isUnderReview) {
            className += ' reviewing';
        }

        if (this.isOverdue) {
            className += ' overdue';
        }

        if (this.issueHasOwner && !this.isCurrentUserOwner) {
            className += ' nonowner';
        }

        return className + this.isPlanning + this.isWaitingOnCustomer + this.isHeld + this.isChallengeSent + this.isHelpWanted + this.isContributorAssigned;
    }

    parseIssue() {
        this.isExternal = _.some(this.props.issue.labels, {name: 'External'}) ? <sup>E</sup> : null;
        this.isImprovement = _.findWhere(this.props.issue.labels, {name: 'Improvement'}) ? <sup>I</sup> : null;
        this.isTask = _.findWhere(this.props.issue.labels, {name: 'Task'}) ? <sup>T</sup> : null;
        this.isFeature = _.findWhere(this.props.issue.labels, {name: 'NewFeature'}) ? <sup>F</sup> : null;
        this.isHourly = _.findWhere(this.props.issue.labels, {name: 'Hourly'}) ? <span className="label hourly">H</span> : null;
        this.isDaily = _.findWhere(this.props.issue.labels, {name: 'Daily'}) ? <span className="label daily">D</span> : null;
        this.isWeekly = _.findWhere(this.props.issue.labels, {name: 'Weekly'}) ? <span className="label weekly">W</span> : null;
        this.isMonthly = _.findWhere(this.props.issue.labels, {name: 'Monthly'}) ? <span className="label monthly">M</span> : null;
        this.isNewhire = _.findWhere(this.props.issue.labels, {name: 'FirstPick'}) ? <span className="label newhire">FP</span> : '';
        this.isWaitingForCustomer = _.findWhere(this.props.issue.labels, {name: 'Waiting for customer'}) ? <span className="label waiting">Waiting</span> : '';
        this.isWhatsNext = _.findWhere(this.props.issue.labels, {name: 'WhatsNext'}) ? <span className="label whatsnext">WN</span> : null;
        this.isPlanning = _.findWhere(this.props.issue.labels, {name: 'Planning'}) ? ' planning' : '';
        this.isOverdue = _.findWhere(this.props.issue.labels, {name: 'Overdue'});
        this.isWaitingOnCustomer = _.findWhere(this.props.issue.labels, {name: 'Waiting for customer'}) ? ' waiting-for-customer' : '';
        this.isHeld = this.props.issue.title.toLowerCase().indexOf('[hold') > -1 ? ' hold' : '';
        this.isChallengeSent = _.findWhere(this.props.issue.labels, {name: 'Take Home Challenge Sent'}) ? ' challenge-sent' : '';
        this.isHelpWanted = _.some(this.props.issue.labels, {name: 'Help Wanted'}) ? ' help-wanted' : '';
        this.isContributorAssigned = this.isExternal && !this.isHelpWanted ? ' contributor-assigned' : '';
        this.isUnderReview = _.find(this.props.issue.labels, label => label.name.toLowerCase() === 'reviewing');
        this.issueHasOwner = this.props.issue.issueHasOwner;
        this.isCurrentUserOwner = this.props.issue.currentUserIsOwner;
    }

    render() {
        this.parseIssue();
        return (
            <div className="panel-item">
                {this.isCurrentUserOwner && (
                    <span className="owner">
                        {'★ '}
                    </span>
                )}
                <a
                    href={this.props.issue.url}
                    className={this.getClassName()}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {this.isHourly}
                    {this.isDaily}
                    {this.isWeekly}
                    {this.isMonthly}
                    {this.isWhatsNext}
                    {this.isNewhire}
                    {this.isWaitingForCustomer}
                    {this.isExternal}
                    {this.isImprovement}
                    {this.isTask}
                    {this.isFeature}
                    {this.props.issue.title}
                </a>

                {this.props.showAttendees && (
                    <div className="AvatarStack AvatarStack--right ml-2 flex-1 flex-shrink-0">
                        <div
                            className="AvatarStack-body tooltipped tooltipped-sw tooltipped-multiline tooltipped-align-right-1 mt-1"
                            aria-label={`Assigned to ${_.pluck(this.props.issue.assignees, 'login').join(', ')}`}
                        >

                            {_.map(this.props.issue.assignees.reverse(), assignee => (
                                <a
                                    className="avatar avatar-user"
                                    aria-label={`${assignee.login}'s assigned issues`}
                                    href={`/Expensify/App/issues?q=assignee%3A${assignee.login}+is%3Aopen`}
                                    data-turbo-frame="repo-content-turbo-frame"
                                    key={assignee.login}
                                >
                                    <img
                                        className="from-avatar avatar-user"
                                        src={assignee.avatarUrl}
                                        width="20"
                                        height="20"
                                        alt={`@${assignee.login}`}
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

ListItemIssue.propTypes = propTypes;
ListItemIssue.defaultProps = defaultProps;

export default ListItemIssue;
