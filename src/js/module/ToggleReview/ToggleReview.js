
/**
 * Displays the toggle button for the reviewing label
 */

const $ = require('jquery');
const React = require('react');
const ReactDOM = require('react-dom');
const Toggle = require('./toggle');

module.exports = function () {
    return {
        draw() {
            ReactDOM.render(
                <Toggle />,
                $('.k2togglereviewing-wrapper')[0],
            );
        },
    };
};
