import React from 'react';
import PropTypes from 'prop-types';
import {PageLayout, Stack} from '@primer/react';
import ListIssuesAssigned from './ListIssuesAssigned';
import ListIssuesHotPicks from './ListIssuesHotPicks';
import ListPRsAssigned from './ListPRsAssigned';
import ListPRsReviewing from './ListPRsReviewing';
import Legend from './Legend';

const propTypes = {
    pollInterval: PropTypes.number.isRequired,
    filterUIOption: PropTypes.string.isRequired,
};

function DashboardLayout({pollInterval, filterUIOption}) {
    return (
        <PageLayout containerWidth="full" padding="none" columnGap="normal">
            <PageLayout.Pane position="start" width="small" aria-label="Dashboard actions and legend">
                <Legend />
            </PageLayout.Pane>
            <PageLayout.Content padding="none">
                <Stack gap="normal">
                    <ListPRsReviewing pollInterval={pollInterval * 2.5} filterUIOption={filterUIOption} />
                    <ListIssuesAssigned pollInterval={pollInterval} filterUIOption={filterUIOption} />
                    <ListPRsAssigned pollInterval={pollInterval * 2.5} />
                    <ListIssuesHotPicks pollInterval={pollInterval * 2.5} />
                </Stack>
            </PageLayout.Content>
        </PageLayout>
    );
}

DashboardLayout.propTypes = propTypes;
DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;
