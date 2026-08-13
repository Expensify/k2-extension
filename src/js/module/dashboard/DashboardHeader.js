import React from 'react';
import {Heading, Stack, Text} from '@primer/react';
import {ProjectIcon} from '@primer/octicons-react';

function DashboardHeader() {
    return (
        <header className="k2-dashboard-header">
            <Stack direction="horizontal" align="start" gap="condensed">
                <ProjectIcon className="k2-dashboard-icon" size={24} />
                <Stack gap="none">
                    <Heading as="h1" className="k2-dashboard-title">K2 dashboard</Heading>
                    <Text className="k2-dashboard-subtitle">Assigned issues and pull requests</Text>
                </Stack>
            </Stack>
        </header>
    );
}

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
