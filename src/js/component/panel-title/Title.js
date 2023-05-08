import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    /** The text to display */
    text: PropTypes.string.isRequired,

    /** Number of panel issues */
    count: PropTypes.number,

    onClick: PropTypes.func,
};

const defaultProps = {
    count: null,
    onClick: () => {},
};

const Title = props => (
    <div tabIndex="0" role="button" onClick={props.onClick}>
        <h3 className="panel-title">
            {`${props.text} ${props.count !== null ? `(${props.count})` : ''}`}
        </h3>
    </div>
);

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;
Title.displayName = 'Title';

export default Title;
