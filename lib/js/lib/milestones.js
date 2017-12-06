'use strict';

const React = require('react');
const _ = require('underscore');
const prefs = require('../../lib/prefs');
const API = require('../../lib/api');

const Milestone = require('./milestone');

module.exports = React.createClass({
  getInitialState() {
    return {
      milestones: []
    };
  },

  componentDidMount() {
    // Fetch our milestones
    API.getMilestones((err, milestones) => {
      if (err) {
        console.error(err);
        return;
      }

      this.setState({
        milestones
      });
    });
  },

  /**
   * Sign out the user so they are prompted for their password again
   */
  signOut() {
    prefs.clear('ghPassword');
    window.location.reload(true);
  },

  render() {
    return (
      <div className="milestones">

        <div className="legend">
          <button onClick={this.signOut} className="btn tooltipped tooltipped-sw" aria-label="Sign Out">Sign Out</button>
        </div>

        <h1>What's Next</h1>

        {_(this.state.milestones).map(milestone => <Milestone key={milestone.id} {...milestone} />)}
      </div>
    );
  }
});
