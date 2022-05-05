import React from 'react';
import PropTypes from 'prop-types';
import FormInput from '../form/FormInput';

const propTypes = {
    /** Information about the form element that is in the list */
    data: PropTypes.shape({
        /** The type of the input element (password, text, etc.) */
        type: PropTypes.string.isRequired,

        /** A hint to display to the user to understand the control better */
        hint: PropTypes.string.isRequired,

        /** The HTML id of the input */
        id: PropTypes.string.isRequired,

        /** The label to display for the input */
        label: PropTypes.string.isRequired,
    }).isRequired,
};

const ListItemForm = (props) => {
    let element;
    let hint;

    switch (props.data.type) {
        case 'password': element = <FormInput data={props.data} type="password" />; break;
        default: element = null;
    }

    if (props.data.hint) {
        hint = <p>{props.data.hint}</p>;
    }


    return (
        <div className="panel-item">
            <label htmlFor={props.data.id}>{props.data.label}</label>
            {element}
            {hint}
        </div>
    );
};

ListItemForm.propTypes = propTypes;
ListItemForm.displayName = 'ListItemForm';

export default ListItemForm;
