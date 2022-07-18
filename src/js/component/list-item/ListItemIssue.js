import React from 'react';
import _ from 'underscore';
import IssuePropTypes from './IssuePropTypes';

const propTypes = {
    /** Information about the issue that is being displayed */
    issue: IssuePropTypes.isRequired,
};

class ListItemIssue extends React.Component {
    getClassName() {
        let className = 'panel-item issue';

        // See if it's under review

        if (this.isUnderReview) {
            className += ' reviewing';
        }

        if (this.isOverdue) {
            className += ' overdue';
        }

        return className + this.isPlanning + this.isWaitingOnCustomer + this.isHeld + this.isChallengeSent + this.isContributorAssigned;
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
        this.isContributorAssigned = _.some(this.props.issue.labels, {name: 'Exported'}) && !_.some(this.props.issue.labels, {name: 'Help Wanted'}) ? ' contributor-assigned' : '';
        this.isUnderReview = _.find(this.props.issue.labels, label => label.name.toLowerCase() === 'reviewing');
    }

    render() {
        this.parseIssue();
        return (
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
        );
    }
}

ListItemIssue.propTypes = propTypes;

export default ListItemIssue;
