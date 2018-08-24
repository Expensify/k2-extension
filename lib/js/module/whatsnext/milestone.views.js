'use strict';

const React = require('react');

const MilestoneViewAll = require('./milestone.view.all');
const MilestoneViewResync = require('./milestone.view.resync');

module.exports = React.createClass({
  getInitialState() {
    return {
      activeTab: 'resync'
    };
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

        {this.state.activeTab === 'resync' && <MilestoneViewResync />}
        {this.state.activeTab === 'all' && <MilestoneViewAll />}
      </div>
    );
  }
});
