'use strict';

const React = require('react');
const _ = require('underscore');
const prefs = require('../../lib/prefs');
const API = require('../../lib/api');

const Milestone = require('./milestone');

module.exports = React.createClass({
  getInitialState() {
    return {
      milestones: [],
      currentView: 'all'
    };
  },

  componentDidMount() {
    this.refresh();
  },

  /**
   * Sign out the user so they are prompted for their password again
   */
  signOut() {
    prefs.clear('ghPassword');
    window.location.reload(true);
  },

  /**
   * Refresh our data from the API
   */
  refresh() {
    prefs.get('whatsnextview', currentView => {
      // Fetch our milestones
      API.getMilestones((err, milestones) => {
        if (err) {
          console.error(err);
          return;
        }

        this.setState({
          milestones,
          currentView
        });
      });
    });
  },

  /**
   * Change what our current view is
   *
   * @param {SyntheticEvent} e
   */
  setCurrentView(e) {
    prefs.set('whatsnextview', e.target.value, () => {
      this.refresh();
    });
  },

  render() {
    return (
      <div className="milestones">

        <div className="legend">
          <button onClick={this.signOut} className="btn tooltipped tooltipped-sw" aria-label="Sign Out">Sign Out</button>
          <br />
          Select view:
          <br />
          <select value={this.state.currentView} onChange={this.setCurrentView}>
            <option value="all">All</option>
            <option value="resync">Resync</option>
            <option value="engineering">Engineering</option>
          </select>
        </div>

        <h1>What's Next</h1>

        {_(this.state.milestones).map(milestone => (<Milestone
          key={milestone.id}
          {...milestone}
          onChange={() => this.refresh()}
        />))}
      </div>
    );
  }
});
