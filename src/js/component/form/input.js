
/**
 * Form Element - Input
 *
 * Displays an HTML input
 *
 * @param {object} data about the element being shown
 */

const React = require('react');
const ReactDOM = require('react-dom');

module.exports = React.createClass({
    componentDidMount() {
        if (this.props.data.focus) {
            ReactDOM.findDOMNode(this).focus();
        }
    },
    render() {
        const type = this.props.type || 'text';
        return (
            <input
                type={type}
                htmlId={this.props.data.id}
                name={this.props.data.id}
                required={this.props.data.required}
                className={this.props.data.className}
            />
        );
    },
});
