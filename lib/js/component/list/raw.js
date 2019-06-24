'use strict';

let React = require('react');
let ListItemIssue = require('../list-item/issue');
let ListItemPull = require('../list-item/pull');
let ListItemForm = require('../list-item/form');

module.exports = (props) => {
  if (!props.data.length) {
    return (
      <div className="blankslate capped clean-background">
        No items
      </div>
    );
  }

  return (
    <div>
      {props.data.map(item => {
        switch (props.type) {
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
};
