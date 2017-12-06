'use strict';

/**
 * K2 Area Picker
 *
 * Displays a bunch of buttons for quickly adding/removing area labels to an issue
 */

const $ = require('jquery');
const React = require('react');
const ReactDOM = require('react-dom');
const Picker = require('./picker');

module.exports = function() {
  return {
    draw: function() {
      ReactDOM.render(
        <Picker />,
        $('.k2pickerarea-wrapper')[0]
      );
    }
  };
};
