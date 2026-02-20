import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    /** The text to display */
    text: PropTypes.string.isRequired,

    /** Number of panel issues */
    count: PropTypes.number,
};

const defaultProps = {
    count: null,
};

function Title(props) {
    return (
        <div>
            <h3 className="panel-title">
                <span className="panel-title-pill">
                    {`${props.text} ${props.count !== null ? `(${props.count})` : ''}`}
                </span>
            </h3>
        </div>
    );
}

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;
Title.displayName = 'Title';

export default Title;
