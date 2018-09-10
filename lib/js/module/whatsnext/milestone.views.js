'use strict';

const React = require('react');

const API = require('../../lib/api');

const MilestoneViewAll = require('./milestone.view.all');
const MilestoneViewResync = require('./milestone.view.resync');

module.exports = React.createClass({
  getInitialState() {
    return {
      activeTab: 'resync',
      activeSubTab: ''
    };
  },

  loadAllIssues() {
    this.setState({activeSubTab: 'allissues'});
    this.activeView.showLoadingState();

    API.getIssuesForMilestones('all', (error, issues) => {
      this.activeView.hideLoadingStateAndShowIssues(issues);
    });
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

  render() {
    return (
      <div>
        <h1>What's Next</h1>

        <div className="tabnav tabnav-pr">
          <nav className="tabnav-tabs">
            <a
              className={`tabnav-tab ${this.state.activeTab === 'resync' ? 'selected' : ''}`}
              onClick={() => {
                this.setState({activeTab: 'resync'});
              }}
            >
              {' '}Resync Milestones Only
            </a>
            <a
              className={`tabnav-tab ${this.state.activeTab === 'all' ? 'selected' : ''}`}
              onClick={() => {
                this.setState({activeTab: 'all'});
              }}
            >
              {' '}All Milestones
            </a>
          </nav>
        </div>

        <div className="tabnav tabnav-pr">
          <nav className="tabnav-tabs">
            <a
              className={`tabnav-tab ${this.state.activeSubTab === 'allissues' ? 'selected' : ''}`}
              onClick={this.loadAllIssues}
            >
              {' '}All Issues
            </a>
            <a
              className={`tabnav-tab ${this.state.activeSubTab === 'whatsnext' ? 'selected' : ''}`}
              onClick={this.loadWhatsNextIssues}
            >
              {' '}What's Next Issues
            </a>
            <a
              className={`tabnav-tab ${this.state.activeSubTab === 'mine' ? 'selected' : ''}`}
              onClick={this.loadMyIssues}
            >
              {' '}My Issues
            </a>
          </nav>
        </div>

        {this.state.activeTab === 'resync' && <MilestoneViewResync ref={el => this.activeView = el} />}
        {this.state.activeTab === 'all' && <MilestoneViewAll ref={el => this.activeView = el} />}
      </div>
    );
  }
});
