import React from 'react';
import PropTypes from 'prop-types';
import ListItemForm from './list-item/ListItemForm';

const propTypes = {
    /** The things to display inside the btn-group */
    children: PropTypes.element.isRequired,
};

const BtnGroup = props => (
    <div className="btn-group">
        {props.children}
    </div>
);

BtnGroup.propTypes = propTypes;
BtnGroup.displayName = 'BtnGroup';

export default BtnGroup;
