import React from 'react';
import PropTypes from 'prop-types';
import {useOnyx} from 'react-native-onyx';
import DashboardHeader from './DashboardHeader';
import DashboardLayout from './DashboardLayout';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';

const propTypes = {
    /** The number of milliseconds to refresh the list of issues */
    pollInterval: PropTypes.number.isRequired,
};

function ListIssues(props) {
    const [preferences = {}] = useOnyx(ONYXKEYS.PREFERENCES);
    const filterUIOption = preferences.filterUIOption || Preferences.getFilterUIOption();

    return (
        <div className="issueList k2-dashboard">
            <DashboardHeader filterUIOption={filterUIOption} onFilterUIOptionChange={Preferences.setFilterUIOption} />
            <DashboardLayout pollInterval={props.pollInterval} filterUIOption={filterUIOption} />
        </div>
    );
}

ListIssues.propTypes = propTypes;

export default ListIssues;
