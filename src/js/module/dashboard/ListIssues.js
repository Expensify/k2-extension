import React from 'react';
import PropTypes from 'prop-types';

// import Filters from './Filters';
import ListIssuesAssigned from './ListIssuesAssigned';
import ListPRsAssigned from './ListPRsAssigned';
import ListPRsReviewing from './ListPRsReviewing';

// import ListIssuesEngineering from './ListIssuesEngineering';
import Legend from './Legend';
import ListIssuesHotPicks from './ListIssuesHotPicks';

const propTypes = {
    /** The number of seconds to refresh the list of issues */
    pollInterval: PropTypes.number.isRequired,
};

function ListIssues(props) {
    return (
        <div className="issueList">
            <Legend />

            <ListPRsReviewing pollInterval={props.pollInterval * 2.5} />

            <ListPRsAssigned pollInterval={props.pollInterval * 2.5} />

            <ListIssuesAssigned pollInterval={props.pollInterval} />

            <ListIssuesHotPicks pollInterval={props.pollInterval * 2.5} />

            {/* Hide these for now while we focus on NewDot */}
            {/* <Filters />

            <ListIssuesEngineering pollInterval={props.pollInterval * 2.5} /> */}
        </div>
    );
}

ListIssues.propTypes = propTypes;

export default ListIssues;
