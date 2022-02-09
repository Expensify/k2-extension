
/**
 * Panel Title
 *
 * This is the component for display the title of a panel
 *
 * @param {string} text to display in the title
 */

const React = require('react');

module.exports = React.createClass({
    render() {
        return (
            <h3 className="panel-title">{this.props.text}</h3>
        );
    },
});
