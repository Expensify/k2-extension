import React from 'react';
import PropTypes from 'prop-types';
import DashboardHeader from './DashboardHeader';
import DashboardLayout from './DashboardLayout';

const propTypes = {
    /** The number of milliseconds to refresh the list of issues */
    pollInterval: PropTypes.number.isRequired,
};

function ListIssues(props) {
    return (
        <div className="issueList k2-dashboard">
            <DashboardHeader />
            <DashboardLayout pollInterval={props.pollInterval} />
        </div>
    );
}

ListIssues.propTypes = propTypes;

export default ListIssues;
