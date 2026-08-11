import React from 'react';
import PropTypes from 'prop-types';
import {useOnyx} from 'react-native-onyx';
import DashboardHeader from './DashboardHeader';
import * as DashboardLayouts from './DashboardLayouts';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';

const propTypes = {
    /** The number of milliseconds to refresh the list of issues */
    pollInterval: PropTypes.number.isRequired,
};

function ListIssues(props) {
    const [preferences = {}] = useOnyx(ONYXKEYS.PREFERENCES);
    const layout = preferences.dashboardLayout || Preferences.getDashboardLayout();

    let Layout = DashboardLayouts.ClassicLayout;
    if (layout === 'focus') {
        Layout = DashboardLayouts.FocusLayout;
    } else if (layout === 'readable') {
        Layout = DashboardLayouts.ReadableLayout;
    }

    return (
        <div className={`issueList k2-dashboard k2-dashboard-${layout}`}>
            <DashboardHeader layout={layout} onLayoutChange={Preferences.setDashboardLayout} />
            <Layout pollInterval={props.pollInterval} />
        </div>
    );
}

ListIssues.propTypes = propTypes;

export default ListIssues;
