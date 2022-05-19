import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    /** The text to display */
    text: PropTypes.string.isRequired,
};

const Title = props => (
    <h3 className="panel-title">{props.text}</h3>
);

Title.propTypes = propTypes;
Title.displayName = 'Title';

export default Title;
