
/**
 * List Item - Form Element variant
 *
 * Displays a form element
 *
 * @param {object} data about the element being shown
 * @param {object} options
 */

const React = require('react');
const FormInput = require('../form/input');

module.exports = React.createClass({

    render() {
        let element;
        let hint;

        switch (this.props.data.type) {
            case 'password': element = <FormInput data={this.props.data} type="password" />; break;
        }

        if (this.props.data.hint) {
            hint = <p>{this.props.data.hint}</p>;
        }


        return (
            <div className="panel-item">
                <label htmlFor={this.props.data.id}>{this.props.data.label}</label>
                {element}
                {hint}
            </div>
        );
    },
});
