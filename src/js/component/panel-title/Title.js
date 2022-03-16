import React from 'react';

const propTypes = {
    /** The text to display */
    text: React.PropTypes.string.isRequired,
};

const Title = props => (
    <h3 className="panel-title">{props.text}</h3>
);

Title.propTypes = propTypes;
Title.displayName = 'Title';

export default Title;
