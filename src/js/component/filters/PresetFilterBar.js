import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import {SegmentedControl, Stack, TextInput} from '@primer/react';
import {SearchIcon} from '@primer/octicons-react';

const propTypes = {
    searchPlaceholder: PropTypes.string.isRequired,
    searchValue: PropTypes.string.isRequired,
    onSearch: PropTypes.func.isRequired,
    presets: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        active: PropTypes.bool.isRequired,
        onSelect: PropTypes.func.isRequired,
    })).isRequired,
};

function PresetFilterBar({
    searchPlaceholder, searchValue, onSearch, presets,
}) {
    const selectPreset = (index) => {
        if (index === undefined || !presets[index]) {
            return;
        }
        presets[index].onSelect();
    };

    return (
        <Stack className="k2-filter-bar" direction="horizontal" align="center" justify="space-between" wrap="wrap" gap="condensed" padding="normal">
            <SegmentedControl aria-label="Filter view" onChange={selectPreset}>
                {_.map(presets, preset => (
                    <SegmentedControl.Button key={preset.id} selected={preset.active} title={preset.description}>
                        {preset.label}
                    </SegmentedControl.Button>
                ))}
            </SegmentedControl>
            <TextInput
                aria-label={searchPlaceholder}
                className="k2-filter-search"
                leadingVisual={SearchIcon}
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={onSearch}
            />
        </Stack>
    );
}

PresetFilterBar.propTypes = propTypes;
PresetFilterBar.displayName = 'PresetFilterBar';

export default PresetFilterBar;
