'use strict';

const React = require('react');
const _ = require('underscore');

const Issue = require('./issue');

module.exports = React.createClass({
  propTypes() {
    return {
      // A list of issues to show
      data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
    };
  },

  render() {
    if (!this.props.data) {
      return null;
    }
    if (!this.props.data.length) {
      return <ul><li className="Box-row">No Items</li></ul>;
    }
    return (
      <ul>
        {_(this.props.data).map(issue => <Issue data={issue} key={issue.id} />)}
      </ul>
    );
  }
});
