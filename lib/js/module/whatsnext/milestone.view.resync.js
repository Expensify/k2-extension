'use strict';

const React = require('react');
const _ = require('underscore');

const GistDB = require('../../lib/gistdb');
const API = require('../../lib/api');
const Milestone = require('./milestone');

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
    // First update our state by setting the visibility of our milestone and resorting,
    // Then update the visibility in our DB
    const milestones = this.state.milestones.slice();
    const targetMilestone = _(milestones).findWhere({id: id});

    targetMilestone.hidden = false;

    this.setState({
      milestones
    });

    GistDB.get(`${this.currentView}.hidden`, (err, data) => {
      if (!err) {
        if (!data) {
          data = [];
        }
        data = _(data).without(id);

        // Set our milestone as hidden in our DB
        GistDB.set(`${this.currentView}.hidden`, data);
      }
    });
  },

  /**
   * Change a milestone from being visible to being hidden
   * @param {Number} id
   */
  hide(id) {
    // First update our state by setting the visibility of our milestone and resorting,
    // Then update the visibility in our DB
    const milestones = this.state.milestones.slice();
    const targetMilestone = _(milestones).findWhere({id: id});

    targetMilestone.hidden = true;

    this.setState({
      milestones
    });

    GistDB.get(`${this.currentView}.hidden`, (err, data) => {
      if (!err) {
        if (!data) {
          data = [];
        }
        data.push(id);

        // Set our milestone as hidden in our DB
        GistDB.set(`${this.currentView}.hidden`, data);
      }
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
