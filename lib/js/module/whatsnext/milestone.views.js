'use strict';

const React = require('react');

const MilestoneViewAll = require('./milestone.view.all');
const MilestoneViewResync = require('./milestone.view.resync');

module.exports = React.createClass({
  render() {
    return (
      <div>
        Milestone Views
        <MilestoneViewAll />
        <MilestoneViewResync />
      </div>
    );
  }
});
