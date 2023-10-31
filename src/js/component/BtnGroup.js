import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    /** The things to display inside the btn-group */
    children: PropTypes.node.isRequired,

    /** Whether this button group should be stacked vertically */
    isVertical: PropTypes.bool,
};

const defaultProps = {
    isVertical: false,
};

function BtnGroup(props) {
    return (
        <div className={props.isVertical ? 'btn-group-vertical' : 'btn-group'}>
            {props.children}
        </div>
    );
}

BtnGroup.propTypes = propTypes;
BtnGroup.defaultProps = defaultProps;
BtnGroup.displayName = 'BtnGroup';

export default BtnGroup;
