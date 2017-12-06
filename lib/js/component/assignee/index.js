'use strict';

let React = require('react');

module.exports = React.createClass({
  render: function() {
    return (
      <a className="assignee" href={this.props.data.html_url} target="_blank">
        <span className="octicon octicon-person" />
        {this.props.data.login}
      </a>
    );
  }
});
