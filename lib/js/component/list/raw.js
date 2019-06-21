'use strict';

/**
 * List
 *
 * Display a list of items depending on the type
 *
 * @param {array} data which will be displayed as items
 * @param {object} options
 */

let React = require('react');
let ListItemIssue = require('../list-item/issue');
let ListItemPull = require('../list-item/pull');
let ListItemForm = require('../list-item/form');

module.exports = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.data.map(item => {
          switch (this.props.type) {
          case 'issue':
            return <ListItemIssue key={item.id} data={item}/>;
          case 'pull':
            return <ListItemPull key={item.id} data={item}/>;
          case 'form':
            return <ListItemForm key={item.id} data={item}/>;
          }
        })}
      </div>
    );
  }
});
