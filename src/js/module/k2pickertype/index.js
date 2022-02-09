
/**
 * Dashboard
 *
 * Displays our home page with the list of issues and pull requests
 */

const $ = require('jquery');
const React = require('react');
const ReactDOM = require('react-dom');
const Picker = require('./picker');

module.exports = function () {
    return {
        draw() {
            ReactDOM.render(
                <Picker />,
                $('.k2pickertype-wrapper')[0],
            );
        },
    };
};
