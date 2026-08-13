import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import {
    ActionList, ActionMenu, Heading, Stack, Text,
} from '@primer/react';
import {ProjectIcon} from '@primer/octicons-react';
import filterOptions from '../../component/filters/filterOptions';

const propTypes = {
    filterUIOption: PropTypes.oneOf(_.pluck(filterOptions, 'id')).isRequired,
    onFilterUIOptionChange: PropTypes.func.isRequired,
};

function DashboardHeader({filterUIOption, onFilterUIOptionChange}) {
    const selectedOption = _.findWhere(filterOptions, {id: filterUIOption}) || filterOptions[0];

    return (
        <header className="k2-dashboard-header">
            <Stack direction="horizontal" align="start" justify="space-between" wrap="wrap" gap="normal">
                <Stack direction="horizontal" align="start" gap="condensed">
                    <ProjectIcon className="k2-dashboard-icon" size={24} />
                    <Stack gap="none">
                        <Heading as="h1" className="k2-dashboard-title">K2 dashboard</Heading>
                        <Text className="k2-dashboard-subtitle">Assigned issues and pull requests</Text>
                    </Stack>
                </Stack>
                <ActionMenu>
                    <ActionMenu.Button>{`Filter UI: ${selectedOption.label}`}</ActionMenu.Button>
                    <ActionMenu.Overlay width="medium">
                        <ActionList selectionVariant="single" aria-label="Filter UI option">
                            {_.map(filterOptions, option => (
                                <ActionList.Item
                                    key={option.id}
                                    selected={option.id === filterUIOption}
                                    onSelect={() => onFilterUIOptionChange(option.id)}
                                    role="menuitemradio"
                                    aria-checked={option.id === filterUIOption}
                                >
                                    {option.label}
                                </ActionList.Item>
                            ))}
                        </ActionList>
                    </ActionMenu.Overlay>
                </ActionMenu>
            </Stack>
        </header>
    );
}

DashboardHeader.propTypes = propTypes;
DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
