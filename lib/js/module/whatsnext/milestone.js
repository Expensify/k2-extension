'use strict';

const React = require('react');
const _ = require('underscore');
const API = require('../../lib/api');
const prefs = require('../../lib/prefs');
const GistDB = require('../../lib/gistdb');

const Issues = require('./issues');

module.exports = React.createClass({
  propTypes() {
    return {
      // The ID of the milestone
      id: React.PropTypes.string.isRequired,
      // The title of the milestone
      title: React.PropTypes.string.isRequired,
      // The percentage of completion for the milestone
      percentComplete: React.PropTypes.number.isRequired,
      // How many open issues the milestone has
      open_issues: React.PropTypes.number.isRequired,
      // How many closed issues the milestone has
      closed_issues: React.PropTypes.number.isRequired,
      // Whether or not the milestone has been hidden
      hidden: React.PropTypes.bool,
      // A callback function to call when data has been updated
      onChange: React.PropTypes.func.isRequired
    };
  },

  getInitialState() {
    return {
      issues: null,
      error: null
    };
  },

  /**
   * Get all the issues for this milestone
   *
   * @param {Boolean} getOnlyMine
   */
  getAllIssues(getOnlyMine) {
    API.getIssuesForMilestone(getOnlyMine, this.props.title, (error, issues) => {
      this.setState({
        issues,
        error
      });
    });
  },

  /**
   * Hides a milestone from the main view
   */
  hide() {
    prefs.get('whatsnextview', whatsnextview => {
      const currentView = whatsnextview || 'all';
      GistDB.get(`${currentView}.hidden`, (err, data) => {
        if (!err) {
          if (!data) {
            data = [];
          }
          data.push(this.props.id);

          // Set our milestone as hidden and tell the parent our data has changed
          GistDB.set(`${currentView}.hidden`, data, this.props.onChange);
        }
      });
    });
  },

  /**
   * Shows a milestone in the main view
   */
  show() {
    prefs.get('whatsnextview', whatsnextview => {
      const currentView = whatsnextview || 'all';
      GistDB.get(`${currentView}.hidden`, (err, data) => {
        if (!err) {
          if (!data) {
            data = [];
          }
          data = _(data).without(this.props.id);

          // Set our milestone as hidden and tell the parent our data has changed
          GistDB.set(`${currentView}.hidden`, data, this.props.onChange);
        }
      });
    });
  },

  render() {
    if (this.props.hidden) {
      return (
        <div>
          {this.props.title} - {this.props.percentComplete}%{' '}
          <a onClick={(e) => {
            e.preventDefault(); this.show();
          }}href="#">Show</a>
        </div>
      );
    }

    return (
      <div className="milestone">
        <div className="panel">
          <h1 className="panel-title">
            {this.props.title}
            <a onClick={(e) => {
              e.preventDefault(); this.hide();
            }} className="pull-right" href="#">Hide</a>
          </h1>

          <div className="panel-item">
            <div className="text-small text-gray">
              <span className="progress-bar progress-bar-small">
                <span className="progress" style={{width: this.props.percentComplete + '%'}}>{' '}</span>
              </span>
              <strong>Progress: </strong>{this.props.percentComplete}%{' '}
              <strong>Open: </strong>{this.props.open_issues}{' '}
              <strong>Closed: </strong>{this.props.closed_issues}
            </div>
            <div className="btn-group">
              <button className="btn btn-sm" onClick={() => this.getAllIssues(false)}>All Issues</button>
              <button className="btn btn-sm" onClick={() => this.getAllIssues(true)}>My Issues</button>
            </div>
          </div>

          {this.state.error && <div>There was an error: {this.state.error}</div>}

          <Issues data={this.state.issues} />
        </div>
      </div>
    );
  }
});
