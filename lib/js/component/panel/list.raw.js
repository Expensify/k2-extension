'use strict';

let React = require('react');
let Title = require('../panel-title/index');
let ListRaw = require('../list/raw');

module.exports = React.createClass({
  render: function() {
    return (
      <div className={`panel ${this.props.extraClass}`}>
        <Title text={this.props.title} />
        <ListRaw
          type={this.props.item}
          data={this.props.data}
        />
      </div>
    );
  }
});
