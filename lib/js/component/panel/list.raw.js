'use strict';

let React = require('react');
let Title = require('../panel-title/index');
let ListRaw = require('../list/raw');

module.exports = (props) => {
  return (
    <div className={`panel ${props.extraClass}`}>
      <Title text={props.title} />
      <ListRaw
        type={props.item}
        data={props.data}
      />
    </div>
  );
};
