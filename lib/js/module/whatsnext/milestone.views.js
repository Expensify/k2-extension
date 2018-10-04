'use strict';

const React = require('react');

const API = require('../../lib/api');

const MilestoneViewResync = require('./milestone.view.resync');

module.exports = React.createClass({
  getInitialState() {
    return {
      activeTab: 'resync',
      activeSubTab: 'whatsnext'
    };
  },

  loadMyIssues() {
    this.setState({activeSubTab: 'mine'});
    this.activeView.showLoadingState();

    API.getIssuesForMilestones('mine', (error, issues) => {
      this.activeView.hideLoadingStateAndShowIssues(issues);
    });
  },

  loadWhatsNextIssues() {
    this.setState({activeSubTab: 'whatsnext'});
    this.activeView.showLoadingState();

    API.getIssuesForMilestones('whatsnext', (error, issues) => {
      this.activeView.hideLoadingStateAndShowIssues(issues);
    });
  },

  loadUnassignedIssues() {
    this.setState({activeSubTab: 'unassigned'});
    this.activeView.showLoadingState();

    API.getIssuesForMilestones('unassigned', (error, issues) => {
      this.activeView.hideLoadingStateAndShowIssues(issues);
    });
  },

  render() {
    return (
      <div>
        <h1>What's Next</h1>

        <div className="tabnav tabnav-pr">
          <nav className="tabnav-tabs">
            <a
              className={`tabnav-tab ${this.state.activeSubTab === 'whatsnext' ? 'selected' : ''}`}
              onClick={this.loadWhatsNextIssues}
            >
              {' '}All
            </a>
            <a
              className={`tabnav-tab ${this.state.activeSubTab === 'mine' ? 'selected' : ''}`}
              onClick={this.loadMyIssues}
            >
              {' '}Mine
            </a>
            <a
              className={`tabnav-tab ${this.state.activeSubTab === 'unassigned' ? 'selected' : ''}`}
              onClick={this.loadUnassignedIssues}
            >
              {' '}Unassigned
            </a>
          </nav>
        </div>

        {this.state.activeTab === 'resync' && <MilestoneViewResync
          ref={el => this.activeView = el}
          onLoad={this.loadWhatsNextIssues}
        />}
      </div>
    );
  }
});
