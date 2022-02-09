
/**
 * Button Group
 *
 * Displays a group of HTML buttons
 */

const React = require('react');

module.exports = React.createClass({
    render() {
        return (
            <div className="btn-group">
                {this.props.children}
            </div>
        );
    },
});
