import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    /** Information about this specific form input */
    data: PropTypes.shape({
        /** Whether or not is should be automatically focused or not */
        focus: PropTypes.bool,

        /** the HTML ID of the input */
        id: PropTypes.string,

        /** Whether or not the input is required for the HTML form */
        required: PropTypes.bool,

        /** A class that can be added to the input */
        className: PropTypes.string,
    }).isRequired,

    /** The type of form input this is */
    type: PropTypes.string,
};
const defaultProps = {
    type: 'text',
};

class FormInput extends React.Component {
    componentDidMount() {
        if (!this.props.data.focus) {
            return;
        }
        this.input.focus();
    }

    render() {
        return (
            <input
                ref={el => this.input = el}
                type={this.props.type}
                htmlid={this.props.data.id}
                name={this.props.data.id}
                required={this.props.data.required}
                className={this.props.data.className}
            />
        );
    }
}

FormInput.propTypes = propTypes;
FormInput.defaultProps = defaultProps;

export default FormInput;
