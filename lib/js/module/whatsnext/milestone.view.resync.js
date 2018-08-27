'use strict';

const React = require('react');
const _ = require('underscore');

const API = require('../../lib/api');
const Milestone = require('./milestone');

module.exports = React.createClass({
  getInitialState() {
    return {
      isLoading: true,
      milestones: []
    };
  },

  componentDidMount() {
    // Fetch our milestones
    API.getMilestones('resync', (err, milestones) => {
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
        {_(this.state.milestones).map(milestone => (<Milestone
          key={milestone.id}
          data={milestone}
          onChange={() => console.log('change')}
        />))}
      </div>
    );
  }
});
