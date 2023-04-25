import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    /** The things to display inside the btn-group */
    children: PropTypes.node.isRequired,
    isDropdown: PropTypes.bool,
};

const defaultProps = {
    isDropdown: false,
};

const BtnGroup = props => (
    <div className={props.isDropdown ? 'btn-group-dropdown' : 'btn-group'}>
        {props.children}
    </div>
);

BtnGroup.propTypes = propTypes;
BtnGroup.defaultProps = defaultProps;
BtnGroup.displayName = 'BtnGroup';

export default BtnGroup;
