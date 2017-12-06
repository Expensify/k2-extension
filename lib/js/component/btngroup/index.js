'use strict';

/**
 * Button Group
 *
 * Displays a group of HTML buttons
 */

let React = require('react');

module.exports = React.createClass({
  render: function() {
    return (
      <div className="btn-group">
        {this.props.children}
      </div>
    );
  }
});
