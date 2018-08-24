'use strict';

/**
 * List Item - Pull Request variant
 *
 * Displays a pull request item
 *
 * @param {object} data the data returned from GitHub for a pull request
 * @param {object} options
 * @param {boolean} options.showAssignee whether or not to show the assignee
 */

let React = require('react');
let moment = require('moment');
let _ = require('underscore');
let Assignee = require('../assignee/index');
let NotAssigned = require('../assignee/none');

module.exports = React.createClass({

  /**
   * Gets the class name for the item
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-06-10
   *
   * @return {string}
   */
  getClassName: function() {
    let className = 'issue';
    let today = moment();
    let days = 7;
    let isOverdue;

    // See if it's overdue
    isOverdue = moment(this.props.data.updated_at).isBefore(today.subtract(days, 'days'), 'day');

    if (isOverdue) {
      className += ' overdue';
    }

    if (this.props.data.title.indexOf('[HOLD') > -1
        || this.props.data.title.indexOf('[WIP') > -1) {
      className += ' hold';
    }

    return className;
  },

  render: function() {
    let person = '';

    // If we are showing the assignee, we need to figure which template to display
    if (this.props.options.showAssignee) {
      if (this.props.data.assignee) {
        person = <Assignee data={this.props.data.assignee} />;
      } else {
        person = <NotAssigned />;
      }
    }

    return (
      <div className="panel-item">

        <span className="panel-item-meta">
          {person}

          <span className="age">Updated: {moment(this.props.data.updated_at).fromNow()}</span>
          <span className="comments">
         Comments:{' '}
            {this.props.data.comments}
          </span>

          {this.props.showReviews ? (
            <span className="comments">
           Reviews:{' '}
              {this.props.data.reviews.length}
            </span>
          ) : null}

          {(this.props.data.pr && this.props.data.pr.status && this.props.data.pr.status.length
            ? (
              <span className={`travis-status ${this.props.data.pr.status[0].state}`}>
           Travis: {this.props.data.pr.status[0].state}
              </span>
            )
            : null)}
        </span>
        <a href={this.props.data.html_url} className={this.getClassName()} target="_blank">
          <span className="octicon octicon-alert" />
          {this.props.data.title}{' '}
        </a>

        {this.props.data.userIsFinishedReviewing ? (
          <span className="Counter">done reviewing</span>
        ) : null}
      </div>
    );
  }
});
