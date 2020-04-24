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
          return <ListItemIssue key={`issue_raw_${item.id}`} data={item}/>;
        case 'pull':
          return <ListItemPull key={`pull_raw_${item.id}`} data={item}/>;
        case 'review':
          return <ListItemPull key={`review_raw_${item.id}`} data={item}/>;
        case 'form':
          return <ListItemForm key={`issue_raw_${item.id}`} data={item}/>;
        }
      })}
    </div>
  );
};
