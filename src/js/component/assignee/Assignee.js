import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    /** The GitHub URL for the assignee */
    html_url: PropTypes.string.isRequired,

    /** The login of the assignee */
    login: PropTypes.string.isRequired,
};

function Assignee(props) {
    return (
        <a className="assignee" href={props.html_url} target="_blank" rel="noreferrer">
            <span className="octicon octicon-person" />
            {props.login}
        </a>
    );
}

Assignee.propTypes = propTypes;
Assignee.displayName = 'Assignee';

export default Assignee;
