'use strict';
const React = require('react');
const _ = require('underscore');
const moment = require('moment');

const API = require('../../lib/api');

module.exports = React.createClass({
  getInitialState() {
    return {
      lastComment: null,
      postingComment: false
    };
  },

  componentWillMount() {
    const today = moment();

    this.isBug = _(this.props.data.labels).findWhere({name: 'Bug'}) ? <sup>B</sup> : null;
    this.isTask = _(this.props.data.labels).findWhere({name: 'Task'}) ? <sup>T</sup> : null;
    this.isFeature = _(this.props.data.labels).findWhere({name: 'Feature'}) ? <sup>F</sup> : null;
    this.isHourly = _(this.props.data.labels).findWhere({name: 'Hourly'}) ? <span className="label hourly">H</span> : null;
    this.isDaily = _(this.props.data.labels).findWhere({name: 'Daily'}) ? <span className="label daily">D</span> : null;
    this.isWeekly = _(this.props.data.labels).findWhere({name: 'Weekly'}) ? <span className="label weekly">W</span> : null;
    this.isMonthly = _(this.props.data.labels).findWhere({name: 'Monthly'}) ? <span className="label monthly">M</span> : null;
    this.isNewhire = _(this.props.data.labels).findWhere({name: 'FirstPick'}) ? <span className="label newhire">FP</span> : '';
    this.isWaitingForCustomer = _(this.props.data.labels).findWhere({name: 'Waiting for customer'}) ? <span className="label waiting">Waiting</span> : '';
    this.isPlanning = _(this.props.data.labels).findWhere({name: 'Planning'}) ? ' planning' : '';
    this.isWaitingOnCustomer = _(this.props.data.labels).findWhere({name: 'Waiting for customer'}) ? ' waiting-for-customer' : '';
    this.isUnderReview = _(this.props.data.labels).find(function(label) {
      return label.name.toLowerCase() === 'reviewing';
    });
    this.isOnHold = this.props.data.title.toLowerCase().indexOf('[hold') > -1;

    // See if the issue is overdue
    let days = 0;
    if (this.isDaily) {
      days = 1;
    } else if (this.isWeekly) {
      days = 7;
    } else if (this.isMonthly) {
      days = 30;
    }
    this.isOverdue = moment(this.props.data.updated_at).isBefore(today.subtract(days, 'days'), 'day');
  },

  componentDidMount() {
    API.getCommentsForIssue(this.props.data.number, (err, data) => {
      // find the last comment done by the assignee
      this.setState({
        lastComment: _(data).chain()
          .sortBy('created_at')
          .reverse()
          .find(comment => {
            return this.props.data.assignee && comment.user.login === this.props.data.assignee.login;
          }).value()
      });
    });
  },

  /**
   * Returns the appropriate classes for displaying this issue
   *
   * @returns {String}
   */
  getClassName() {
    let className = 'issue';

    // See if it's on hold
    if (this.isOnHold) {
      className += ' reviewing';
    }

    if (this.isOverdue) {
      className += ' overdue';
    }

    return className;
  },

  /**
   * Post a comment to the issue
   */
  postComment() {
    this.setState({postingComment: true});
    API.postIusseComment(this.props.data.number, this.commentField.value, err => {
      if (!err) {
        this.commentField.value = '';
        setTimeout(() => {
          this.setState({postingComment: false});
        }, 2000);
      }
    });
  },

  /**
   * Post a quick bump to the assignee
   */
  postQuickBump() {
    this.setState({postingComment: true});
    const comment = `@${this.props.data.assignee.login} bump for an update`;
    API.postIusseComment(this.props.data.number, comment, err => {
      if (!err) {
        this.commentField.value = '';
        setTimeout(() => {
          this.setState({postingComment: false});
        }, 2000);
      }
    });
  },

  render() {
    const lastCommentDate = this.state.lastComment && moment(this.state.lastComment.created_at).fromNow();
    return (
      <div className="panel-item">
        <a href={this.props.data.html_url} className={this.getClassName()} target="_blank">
          {this.isHourly}
          {this.isDaily}
          {this.isWeekly}
          {this.isMonthly}
          {this.isNewhire}
          {this.isWaitingForCustomer}
          {this.isBug}
          {this.isTask}
          {this.isFeature}
          {(this.props.data.assignee && this.props.data.assignee.login) || 'UNASSIGNED'} - {this.props.data.title}
        </a>
        {this.state.lastComment && (
          <div className="lastcomment text-small text-gray">
            <strong>
              {lastCommentDate}{' '}
              {this.state.lastComment.user.login}
            </strong>{' - '}
            {this.state.lastComment.body}
          </div>
        )}

        <div className="form-inline">
          {this.state.postingComment && <span className="posting-comment-label">Posting...</span>}
          <input type="text" className="form-control" ref={el => this.commentField = el} placeholder="Post a comment..."/>
          {' '}
          <button className="btn btn-primary" onClick={this.postComment}>Comment</button>
          {' '}
          {this.props.data.assignee && <button className="btn tooltipped tooltipped-sw" aria-label="Send a quick comment to bump the assignee for an update" onClick={this.postQuickBump}>Quick Bump</button>}
        </div>
      </div>
    );
  }
});
