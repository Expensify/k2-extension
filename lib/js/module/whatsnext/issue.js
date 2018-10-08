'use strict';
const React = require('react');
const _ = require('underscore');
const moment = require('moment');

const API = require('../../lib/api');
const Members = require('../../lib/members');

module.exports = React.createClass({
  propTypes() {
    return {
      // A callback that is triggered when we click the move up button
      onMoveUp: React.PropTypes.func,
      // A callback that is triggered when we click the move down button
      onMoveDown: React.PropTypes.func
    };
  },

  getInitialState() {
    return {
      lastComment: null,
      postingComment: false,
      commentText: 'Comment',
      quickBumpText: 'Quick Bump'
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
        return (text.indexOf('deployed to') === 3 || text.indexOf('cherry picked to') === 3) && text.indexOf('/staging') > -1;
      });
      const deployedToProduction = _(data).find(comment => {
        const text = comment.body_html.toLowerCase();
        return (text.indexOf('deployed to') === 3 || text.indexOf('cherry picked to') === 3) && text.indexOf('/production') > -1;
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
    if (!this.commentField.value) {
      return;
    }

    const newComment = this.commentField.value;
    this.commentField.value = '';

    this.setState({
      postingComment: true,
      commentText: 'Commenting...'
    });

    API.postIusseComment(this.props.data.number, newComment, err => {
      if (!err) {
        setTimeout(() => {
          this.setState({
            postingComment: false,
            commentText: 'Comment'
          });
        }, 2000);
      }
    });
  },

  /**
   * Post a quick bump to the assignee
   */
  postQuickBump() {
    this.commentField.value = '';
    this.setState({
      postingComment: true,
      quickBumpText: 'Bumping...'
    });

    const comment = `@${this.props.data.assignee.login} bump for an update`;
    API.postIusseComment(this.props.data.number, comment, err => {
      if (!err) {
        setTimeout(() => {
          this.setState({
            postingComment: false,
            quickBumpText: 'QuickBump'
          });
        }, 2000);
      }
    });
  },

  render() {
    const lastCommentDate = this.state.lastComment && moment(this.state.lastComment.created_at).fromNow();
    return (
      <li className="Box-row">

        <a href={this.props.data.html_url} className={this.getClassName()} target="_blank">
          {!this.isUnassigned && Members.getNameFromLogin(this.props.data.assignee.login)} - {this.props.data.title}
        </a>

        <div className="labels">
          {this.isPlanning && <span className="label planning">Planning</span>}
          {this.isOnHold && <span className="label hold">HOLD</span>}
          {this.isUnassigned && <span className="label unassigned">UNASSIGNED</span>}
          {this.isOverdue && <span className="label overdue">OVERDUE</span>}
          {this.isUnderReview && <span className="label underreview">Under Review</span>}
          {this.isOnlyOnStaging && <span className="label onstaging">On Staging</span>}
          {this.isOnStagingAndProduction && <span className="label onproduction">On Production</span>}
        </div>

        {this.state.lastComment && (
          <div className={`timeline-comment-wrapper js-comment-container lastcomment ${this.isOnHold ? 'hold' : ''}`}>
            <div className="unminimized-comment editable-comment comment previewable-edit timeline-comment reorderable-task-lists ">
              <div className="timeline-comment-header clearfix">
                <h3 className="timeline-comment-header-text f5 text-normal">
                  <strong className="css-truncate">
                    <a
                      className="author text-inherit css-truncate-target rgh-fullname"
                      data-hovercard-type="user"
                      data-hovercard-url="/hovercards?user_id=2007162"
                      data-octo-click="hovercard-link-click"
                      data-octo-dimensions="link_type:self"
                      href="/{this.state.lastComment.user.login}"
                      aria-describedby="hovercard-aria-description"
                    >{Members.getNameFromLogin(this.state.lastComment.user.login)}</a>
                  </strong> {lastCommentDate}
                </h3>
              </div>
              <div className="edit-comment-hide" dangerouslySetInnerHTML={{__html: this.state.lastComment.body_html}} />
            </div>

          </div>
        )}

        {!this.isOnHold && <div className="form-inline">
          <input
            type="text"
            className="form-control"
            ref={el => this.commentField = el}
            placeholder={this.state.postingComment ? 'Posting...' : 'Post a comment'}
          />
          {' '}
          <button className="btn btn-secondary" onClick={this.postComment}>{this.state.commentText}</button>
          {' '}
          {this.props.data.assignee && <button className="btn tooltipped tooltipped-sw" aria-label="Send a quick comment to bump the assignee for an update" onClick={this.postQuickBump}>{this.state.quickBumpText}</button>}
          {' '}
          <button className="btn tooltipped tooltipped-sw" aria-label="Increase issue priority" onClick={this.props.onMoveUp}>▲</button>
          {' '}
          <button className="btn tooltipped tooltipped-sw" aria-label="Decrease issue priority" onClick={this.props.onMoveDown}>▼</button>
        </div>}

      </li>
    );
  }
});
