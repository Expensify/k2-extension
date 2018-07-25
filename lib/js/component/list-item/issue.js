'use strict';

/**
 * List Item - Issue variant
 *
 * Displays an issue
 *
 * @param {object} data the data being returned from GH for an issue
 * @param {string} data.type daily|weekly|monthly|none identifies the type of issue
 */

let React = require('react');
let _ = require('underscore');

module.exports = React.createClass({
  parseIssue() {
    this.isImprovement = _(this.props.data.labels).findWhere({name: 'Improvement'}) ? <sup>I</sup> : null;
    this.isTask = _(this.props.data.labels).findWhere({name: 'Task'}) ? <sup>T</sup> : null;
    this.isFeature = _(this.props.data.labels).findWhere({name: 'Feature'}) ? <sup>F</sup> : null;
    this.isHourly = _(this.props.data.labels).findWhere({name: 'Hourly'}) ? <span className="label hourly">H</span> : null;
    this.isDaily = _(this.props.data.labels).findWhere({name: 'Daily'}) ? <span className="label daily">D</span> : null;
    this.isWeekly = _(this.props.data.labels).findWhere({name: 'Weekly'}) ? <span className="label weekly">W</span> : null;
    this.isMonthly = _(this.props.data.labels).findWhere({name: 'Monthly'}) ? <span className="label monthly">M</span> : null;
    this.isNewhire = _(this.props.data.labels).findWhere({name: 'FirstPick'}) ? <span className="label newhire">FP</span> : '';
    this.isWaitingForCustomer = _(this.props.data.labels).findWhere({name: 'Waiting for customer'}) ? <span className="label waiting">Waiting</span> : '';
    this.isPlanning = _(this.props.data.labels).findWhere({name: 'Planning'}) ? ' planning' : '';
    this.isOverdue = _(this.props.data.labels).findWhere({name: 'Overdue'});
    this.isWaitingOnCustomer = _(this.props.data.labels).findWhere({name: 'Waiting for customer'}) ? ' waiting-for-customer' : '';
    this.isUnderReview = _(this.props.data.labels).find(function(label) {
      return label.name.toLowerCase() === 'reviewing';
    });
  },
  getClassName: function() {
    let className = 'panel-item issue';

    // See if it's under review

    if (this.isUnderReview) {
      className += ' reviewing';
    }

    if (this.isOverdue) {
      className += ' overdue';
    }

    return className + this.isPlanning + this.isWaitingOnCustomer;
  },
  render: function() {
    this.parseIssue();
    return (
      <a href={this.props.data.html_url} className={this.getClassName()} target="_blank">
        {this.isHourly}
        {this.isDaily}
        {this.isWeekly}
        {this.isMonthly}
        {this.isNewhire}
        {this.isWaitingForCustomer}
        {this.isImprovement}
        {this.isTask}
        {this.isFeature}
        {this.props.data.title}
      </a>
    );
  }
});
