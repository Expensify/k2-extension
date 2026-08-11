import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {
    Details, PageLayout, SegmentedControl, Stack,
} from '@primer/react';
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
            <PageLayout.Content padding="none">
                <ListIssuesAssigned pollInterval={pollInterval} />
            </PageLayout.Content>
            <PageLayout.Pane position="end" width="large" aria-label="Pull request and Hot Pick queues">
                <Stack gap="normal">
                    <ListPRsReviewing pollInterval={pollInterval * 2.5} />
                    <ListPRsAssigned pollInterval={pollInterval * 2.5} />
                    <ListIssuesHotPicks pollInterval={pollInterval * 2.5} />
                    <Details>
                        <Details.Summary>Actions and status legend</Details.Summary>
                        <div className="k2-details-content">
                            <Legend />
                        </div>
                    </Details>
                </Stack>
            </PageLayout.Pane>
        </PageLayout>
    );
}

function ReadableLayout({pollInterval}) {
    const [selectedSection, setSelectedSection] = useState(0);

    return (
        <Stack gap="normal">
            <Stack direction="horizontal" justify="space-between" align="center" wrap="wrap" gap="condensed">
                <SegmentedControl aria-label="Dashboard section" onChange={setSelectedSection}>
                    <SegmentedControl.Button selected={selectedSection === 0}>Assigned issues</SegmentedControl.Button>
                    <SegmentedControl.Button selected={selectedSection === 1}>Reviews</SegmentedControl.Button>
                    <SegmentedControl.Button selected={selectedSection === 2}>My PRs</SegmentedControl.Button>
                    <SegmentedControl.Button selected={selectedSection === 3}>Hot Picks</SegmentedControl.Button>
                </SegmentedControl>
                <Details>
                    <Details.Summary>Actions and legend</Details.Summary>
                    <div className="k2-details-content k2-readable-legend">
                        <Legend />
                    </div>
                </Details>
            </Stack>
            <div className="k2-readable-layout">
                {selectedSection === 0 && <ListIssuesAssigned pollInterval={pollInterval} layout="readable" />}
                {selectedSection === 1 && <ListPRsReviewing pollInterval={pollInterval * 2.5} />}
                {selectedSection === 2 && <ListPRsAssigned pollInterval={pollInterval * 2.5} />}
                {selectedSection === 3 && <ListIssuesHotPicks pollInterval={pollInterval * 2.5} />}
            </div>
        </Stack>
    );
}

ClassicLayout.propTypes = propTypes;
FocusLayout.propTypes = propTypes;
ReadableLayout.propTypes = propTypes;

export {ClassicLayout, FocusLayout, ReadableLayout};
