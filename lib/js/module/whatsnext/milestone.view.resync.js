'use strict';

const React = require('react');
const _ = require('underscore');

const API = require('../../lib/api');
const Milestone = require('./milestone');
const MilestoneStore = require('../../store/milestones');

module.exports = React.createClass({
  currentView: 'resync',

  getInitialState() {
    return {
      isLoading: true,
      milestones: []
    };
  },

  componentDidMount() {
    // Fetch our milestones
    API.getMilestones(this.currentView, (err, milestones) => {
      if (err) {
        console.error(err);
        return;
      }

      this.setState({
        isLoading: false,
        milestones
      });
    });
  },

  /**
   * Change a milestone from hidden to being visible
   * @param {Number} id
   */
  show(id) {
    MilestoneStore.show(this.currentView, id, this.state.milestones, (newMilestones) => {
      this.setState({
        milestones: newMilestones
      });
    });
  },

  /**
   * Change a milestone from being visible to being hidden
   * @param {Number} id
   */
  hide(id) {
    MilestoneStore.hide(this.currentView, id, this.state.milestones, (newMilestones) => {
      this.setState({
        milestones: newMilestones
      });
    });
  },

  render() {
    if (this.state.isLoading) {
      return (
        <div>
          Loading...
        </div>
      );
    }

    if (!this.state.milestones.length) {
      return (
        <div>
          No milestones today.
        </div>
      );
    }

    return (
      <div>
        {_(this.state.milestones)
          .chain()
          .filter(m => !m.hidden)
          .map(m => (<Milestone
            key={m.id}
            data={m}
            onHide={this.hide}
            onShow={this.show}
          />))
          .value()}

        {_(this.state.milestones)
          .chain()
          .filter(m => m.hidden)
          .map(m => (<Milestone
            key={m.id}
            data={m}
            onHide={this.hide}
            onShow={this.show}
          />))
          .value()}
      </div>
    );
  }
});
