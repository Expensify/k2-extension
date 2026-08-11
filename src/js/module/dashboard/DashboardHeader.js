import React from 'react';
import PropTypes from 'prop-types';
import {PageHeader, SegmentedControl} from '@primer/react';
import {ProjectIcon} from '@primer/octicons-react';

const LAYOUTS = ['classic', 'focus', 'readable'];

const propTypes = {
    layout: PropTypes.oneOf(LAYOUTS).isRequired,
    onLayoutChange: PropTypes.func.isRequired,
};

function DashboardHeader({layout, onLayoutChange}) {
    return (
        <PageHeader className="k2-dashboard-header" hasBorder>
            <PageHeader.TitleArea variant="medium">
                <PageHeader.LeadingVisual>
                    <ProjectIcon size={24} />
                </PageHeader.LeadingVisual>
                <PageHeader.Title as="h1">K2 dashboard</PageHeader.Title>
                <PageHeader.Description>
                    Assigned issues and pull requests
                </PageHeader.Description>
            </PageHeader.TitleArea>
            <PageHeader.Actions>
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
            </PageHeader.Actions>
        </PageHeader>
    );
}

DashboardHeader.propTypes = propTypes;
DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
