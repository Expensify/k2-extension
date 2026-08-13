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
};

function ClassicLayout({pollInterval}) {
    return (
        <PageLayout containerWidth="full" padding="none" columnGap="normal">
            <PageLayout.Pane position="start" width="small" aria-label="Dashboard actions and legend">
                <Legend />
            </PageLayout.Pane>
            <PageLayout.Content padding="none">
                <Stack gap="normal">
                    <ListPRsReviewing pollInterval={pollInterval * 2.5} />
                    <ListIssuesAssigned pollInterval={pollInterval} />
                    <ListPRsAssigned pollInterval={pollInterval * 2.5} />
                    <ListIssuesHotPicks pollInterval={pollInterval * 2.5} />
                </Stack>
            </PageLayout.Content>
        </PageLayout>
    );
}

function FocusLayout({pollInterval}) {
    return (
        <PageLayout containerWidth="full" padding="none" columnGap="normal">
            <PageLayout.Pane position="start" width="small" aria-label="Dashboard actions and legend">
                <Legend />
            </PageLayout.Pane>
            <PageLayout.Content padding="none">
                <Stack gap="normal">
                    <ListIssuesAssigned pollInterval={pollInterval} />
                    <ListPRsReviewing pollInterval={pollInterval * 2.5} />
                    <ListPRsAssigned pollInterval={pollInterval * 2.5} />
                    <ListIssuesHotPicks pollInterval={pollInterval * 2.5} />
                </Stack>
            </PageLayout.Content>
        </PageLayout>
    );
}

function ReadableLayout({pollInterval}) {
    return (
        <PageLayout containerWidth="full" padding="none" columnGap="normal">
            <PageLayout.Pane position="start" width="small" aria-label="Dashboard actions and legend">
                <Legend />
            </PageLayout.Pane>
            <PageLayout.Content padding="none">
                <div className="k2-readable-layout">
                    <Stack gap="normal">
                        <ListIssuesAssigned pollInterval={pollInterval} layout="readable" />
                        <ListPRsReviewing pollInterval={pollInterval * 2.5} />
                        <ListPRsAssigned pollInterval={pollInterval * 2.5} />
                        <ListIssuesHotPicks pollInterval={pollInterval * 2.5} />
                    </Stack>
                </div>
            </PageLayout.Content>
        </PageLayout>
    );
}

ClassicLayout.propTypes = propTypes;
FocusLayout.propTypes = propTypes;
ReadableLayout.propTypes = propTypes;

export {ClassicLayout, FocusLayout, ReadableLayout};
