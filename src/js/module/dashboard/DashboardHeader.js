import React from 'react';
import PropTypes from 'prop-types';
import {
    Heading, SegmentedControl, Stack, Text,
} from '@primer/react';
import {ProjectIcon} from '@primer/octicons-react';

const LAYOUTS = ['classic', 'focus', 'readable'];

const propTypes = {
    layout: PropTypes.oneOf(LAYOUTS).isRequired,
    onLayoutChange: PropTypes.func.isRequired,
};

function DashboardHeader({layout, onLayoutChange}) {
    return (
        <header className="k2-dashboard-header">
            <Stack direction="horizontal" align="center" justify="space-between" wrap="wrap" gap="normal">
                <Stack direction="horizontal" align="center" gap="condensed">
                    <ProjectIcon size={24} />
                    <Stack gap="none">
                        <Heading as="h1" className="k2-dashboard-title">K2 dashboard</Heading>
                        <Text className="k2-dashboard-subtitle">Assigned issues and pull requests</Text>
                    </Stack>
                </Stack>
                <SegmentedControl
                    aria-label="Dashboard layout"
                    onChange={index => onLayoutChange(LAYOUTS[index])}
                    size="small"
                    variant={{narrow: 'dropdown', regular: 'default'}}
                >
                    <SegmentedControl.Button selected={layout === 'classic'}>Classic</SegmentedControl.Button>
                    <SegmentedControl.Button selected={layout === 'focus'}>Focus</SegmentedControl.Button>
                    <SegmentedControl.Button selected={layout === 'readable'}>Readable</SegmentedControl.Button>
                </SegmentedControl>
            </Stack>
        </header>
    );
}

DashboardHeader.propTypes = propTypes;
DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
