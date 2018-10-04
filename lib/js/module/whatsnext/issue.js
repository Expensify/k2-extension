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

    this.isPlanning = _(this.props.data.labels).findWhere({name: 'Planning'}) ? ' planning' : '';
    this.isUnderReview = _(this.props.data.labels).find(function(label) {
      return label.name.toLowerCase() === 'reviewing';
    });
    this.isOnHold = this.props.data.title.toLowerCase().indexOf('[hold') > -1;
    this.isUnassigned = !this.props.data.assignee;
    this.isOnlyOnStaging = false;
    this.isOnStagingAndProduction = false;

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
      // Now that we have the comments, we can see where it's deployed to
      const deployedToStaging = _(data).find(comment => {
        const text = comment.body_html.toLowerCase();
        return (text.indexOf('deployed to') === 0 || text.indexOf('cherry picked to') === 0) && text.indexOf('/staging') > -1;
      });
      const deployedToProduction = _(data).find(comment => {
        const text = comment.body_html.toLowerCase();
        return (text.indexOf('deployed to') === 0 || text.indexOf('cherry picked to') === 0) && text.indexOf('/production') > -1;
      });
      this.isOnlyOnStaging = deployedToStaging && !deployedToProduction;
      this.isOnStagingAndProduction = deployedToStaging && deployedToProduction;

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
    let className = 'issue link-gray-dark v-align-middle no-underline h4';

    // See if it's on hold
    if (this.isOnHold) {
      className += ' reviewing';
    }

    if (this.isOverdue) {
      className += ' overdue';
    }

    if (this.isUnassigned) {
      className += ' unassigned';
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
      <li className="Box-row">

        <div>
          {this.isPlanning && <span className="label planning">Planning</span>}
          {this.isUnderReview && <span className="label underreview">Under Review</span>}
          {this.isOnHold && <span className="label hold">HOLD</span>}
          {this.isUnassigned && <span className="label unassigned">UNASSIGNED</span>}
          {this.isOverdue && <span className="label overdue">OVERDUE</span>}
          {this.isOnlyOnStaging && <span className="label onstaging">On Staging</span>}
          {this.isOnStagingAndProduction && <span className="label onproduction">On Production</span>}
        </div>

        <a href={this.props.data.html_url} className={this.getClassName()} target="_blank">
          {!this.isUnassigned && this.props.data.assignee.login} - {this.props.data.title}
        </a>

        {this.state.lastComment && (
          <div className={`lastcomment ${this.isOnHold ? 'hold' : ''}`}>
            <small>
              <strong>
                {this.state.lastComment.user.login}
              </strong>
              {' - '}
              {lastCommentDate}
            </small>

            <div className="comment-body" dangerouslySetInnerHTML={{__html: this.state.lastComment.body_html}} />
          </div>
        )}

        {!this.isOnHold && <div className="form-inline">
          {this.state.postingComment && <span className="posting-comment-label">Posting...</span>}
          <input type="text" className="form-control" ref={el => this.commentField = el} placeholder="Post a comment..."/>
          {' '}
          <button className="btn btn-secondary" onClick={this.postComment}>Comment</button>
          {' '}
          {this.props.data.assignee && <button className="btn tooltipped tooltipped-sw" aria-label="Send a quick comment to bump the assignee for an update" onClick={this.postQuickBump}>Quick Bump</button>}
        </div>}
      </li>
    );
  }
});
