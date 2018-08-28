'use strict';

const React = require('react');
const API = require('../../lib/api');

const Issues = require('./issues');

module.exports = React.createClass({
  propTypes() {
    return {
      data: React.PropTypes.shapeOf({
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
        hidden: React.PropTypes.bool
      }).isRequired,
      onHide: React.PropTypes.func.isRequired,
      onShow: React.PropTypes.func.isRequired
    };
  },

  getInitialState() {
    return {
      currentView: null,
      loading: false,
      issues: null,
      error: null
    };
  },

  /**
   * Get all the issues for this milestone
   *
   * @param {String} type
   */
  getAllIssues(type) {
    this.setState({
      loading: true
    }, () => {
      API.getIssuesForMilestone(type, this.props.data.title, (error, issues) => {
        this.setState({
          currentView: type,
          loading: false,
          issues,
          error
        });
      });
    });
  },

  render() {
    if (this.props.data.hidden) {
      return (
        <div>
          {this.props.data.title} - {this.props.data.percentComplete}%{' '}
          <button className="btn-link" onClick={() => this.props.onShow(this.props.data.id)}>Show</button>
        </div>
      );
    }

    return (
      <div className="milestone">
        <div className="table-list-header">
          <div className="table-list-filters">
            <div className="table-list-header-toggle float-left">
              <div className="table-list-header-meta">
                <strong>{this.props.data.title}</strong>
              </div>
            </div>

            <div className="table-list-header-toggle float-right">
              <button
                className={`btn-link ${this.state.currentView === 'all' ? 'selected' : ''}`}
                onClick={() => this.getAllIssues('all')}
              >
                All Issues
              </button>
              <button
                className={`btn-link ${this.state.currentView === 'whatsnext' ? 'selected' : ''}`}
                onClick={() => this.getAllIssues('whatsnext')}
              >
                What's Next Issues
              </button>
              <button
                className={`btn-link ${this.state.currentView === 'mine' ? 'selected' : ''}`}
                onClick={() => this.getAllIssues('mine')}
              >
                My Issues
              </button>
              <button className="btn-link" onClick={() => this.props.onHide(this.props.data.id)}>
                Hide
              </button>
            </div>
          </div>
        </div>

        <div className="border-right border-bottom border-left">

          {this.state.error && <div>There was an error: {this.state.error}</div>}

          <ul>
            <li className="Box-row">

              {this.props.data.description && <p>
                {this.props.data.description}
              </p>}
              <span className="progress-bar progress-bar-small">
                <span className="progress" style={{width: this.props.data.percentComplete + '%'}}>{' '}</span>
              </span>
              Progress: {this.props.data.percentComplete}%{' '}
              Open: {this.props.data.open_issues}{' '}
              Closed: {this.props.data.closed_issues}

            </li>

            {this.state.error && <li>There was an error: {this.state.error}</li>}
          </ul>

          {this.state.loading && <ul>
            <li className="Box-row">Loading...</li>
          </ul>}

          {!this.state.loading && <Issues data={this.state.issues} />}
        </div>
      </div>
    );
  }
});
