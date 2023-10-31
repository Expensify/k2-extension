import React from 'react';

const propTypes = {
    /** The GitHub URL for the assignee */
    html_url: React.PropTypes.string.isRequired,

    /** The login of the assignee */
    login: React.PropTypes.string.isRequired,
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
