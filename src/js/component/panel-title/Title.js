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

const Title = props => (
    <div>
        <h3 className="panel-title">
            {props.text}
            {props.count !== null && (
                <>
                    {` (${props.count})`}
                </>
            )}
        </h3>
    </div>
);

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;
Title.displayName = 'Title';

export default Title;
