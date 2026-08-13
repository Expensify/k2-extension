import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import {
    ActionList, ActionMenu, Button, SegmentedControl, Stack, TextInput, Token,
} from '@primer/react';
import {SearchIcon} from '@primer/octicons-react';
import filterOptions from './filterOptions';

const itemPropType = PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
});

const propTypes = {
    mode: PropTypes.oneOf(_.pluck(filterOptions, 'id')).isRequired,
    searchPlaceholder: PropTypes.string.isRequired,
    searchValue: PropTypes.string.isRequired,
    onSearch: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    filters: PropTypes.arrayOf(itemPropType).isRequired,
    presets: PropTypes.arrayOf(itemPropType).isRequired,
    structuredMenus: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(itemPropType).isRequired,
    })).isRequired,
};

function Search({placeholder, value, onChange}) {
    return (
        <TextInput
            aria-label={placeholder}
            className="k2-filter-search"
            leadingVisual={SearchIcon}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
    );
}

Search.propTypes = {
    placeholder: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

function FilterMenu({label, items, selectionVariant}) {
    const selectedCount = _.filter(items, 'active').length;
    const buttonLabel = selectedCount ? `${label} (${selectedCount})` : label;

    return (
        <ActionMenu>
            <ActionMenu.Button>{buttonLabel}</ActionMenu.Button>
            <ActionMenu.Overlay width="medium">
                <ActionList selectionVariant={selectionVariant} aria-label={label}>
                    {_.map(items, item => (
                        <ActionList.Item
                            key={item.id}
                            selected={item.active}
                            onSelect={item.onSelect}
                            role={selectionVariant === 'multiple' ? 'menuitemcheckbox' : 'menuitemradio'}
                            aria-checked={item.active}
                        >
                            {item.label}
                        </ActionList.Item>
                    ))}
                </ActionList>
            </ActionMenu.Overlay>
        </ActionMenu>
    );
}

FilterMenu.propTypes = {
    label: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(itemPropType).isRequired,
    selectionVariant: PropTypes.oneOf(['single', 'multiple']).isRequired,
};

function FilterBar({
    mode,
    searchPlaceholder,
    searchValue,
    onSearch,
    onClear,
    filters,
    presets,
    structuredMenus,
}) {
    const activeFilters = _.filter(filters, 'active');
    const search = <Search placeholder={searchPlaceholder} value={searchValue} onChange={onSearch} />;
    const selectPreset = (index) => {
        if (index === undefined || !presets[index]) {
            return;
        }
        presets[index].onSelect();
    };

    if (mode === 'single-menu') {
        return (
            <Stack className="k2-filter-bar" direction="horizontal" align="center" justify="space-between" wrap="wrap" gap="condensed" padding="normal">
                {search}
                <Stack direction="horizontal" align="center" gap="condensed">
                    <FilterMenu label="Filters" items={filters} selectionVariant="multiple" />
                    {!!activeFilters.length && <Button onClick={onClear}>Clear</Button>}
                </Stack>
            </Stack>
        );
    }

    if (mode === 'chips') {
        return (
            <Stack className="k2-filter-bar" gap="condensed" padding="normal">
                {search}
                <Stack direction="horizontal" align="center" wrap="wrap" gap="condensed">
                    {_.map(filters, filter => (
                        <Button
                            key={filter.id}
                            size="small"
                            variant={filter.active ? 'primary' : 'default'}
                            onClick={filter.onSelect}
                        >
                            {filter.label}
                        </Button>
                    ))}
                    {!!activeFilters.length && <Button size="small" variant="invisible" onClick={onClear}>Clear</Button>}
                </Stack>
            </Stack>
        );
    }

    if (mode === 'presets') {
        return (
            <Stack className="k2-filter-bar" direction="horizontal" align="center" justify="space-between" wrap="wrap" gap="condensed" padding="normal">
                <SegmentedControl aria-label="Filter view" onChange={selectPreset}>
                    {_.map(presets, preset => (
                        <SegmentedControl.Button key={preset.id} selected={preset.active}>
                            {preset.label}
                        </SegmentedControl.Button>
                    ))}
                </SegmentedControl>
                {search}
            </Stack>
        );
    }

    if (mode === 'structured') {
        return (
            <Stack className="k2-filter-bar" direction="horizontal" align="center" justify="space-between" wrap="wrap" gap="condensed" padding="normal">
                {search}
                <Stack direction="horizontal" align="center" wrap="wrap" gap="condensed">
                    {_.map(structuredMenus, menu => (
                        <FilterMenu key={menu.id} label={menu.label} items={menu.items} selectionVariant="single" />
                    ))}
                    {!!activeFilters.length && <Button onClick={onClear}>Clear</Button>}
                </Stack>
            </Stack>
        );
    }

    return (
        <Stack className="k2-filter-bar" gap="condensed" padding="normal">
            <Stack direction="horizontal" align="center" justify="space-between" wrap="wrap" gap="condensed">
                <SegmentedControl aria-label="Quick filter view" onChange={selectPreset}>
                    {_.map(presets, preset => (
                        <SegmentedControl.Button key={preset.id} selected={preset.active}>
                            {preset.label}
                        </SegmentedControl.Button>
                    ))}
                </SegmentedControl>
                {search}
                <FilterMenu label="More filters" items={filters} selectionVariant="multiple" />
            </Stack>
            {!!activeFilters.length && (
                <Stack className="k2-filter-tokens" direction="horizontal" align="center" wrap="wrap" gap="condensed">
                    {_.map(activeFilters, filter => (
                        <Token key={filter.id} text={filter.label} onRemove={filter.onSelect} />
                    ))}
                    <Button size="small" variant="invisible" onClick={onClear}>Clear all</Button>
                </Stack>
            )}
        </Stack>
    );
}

FilterBar.propTypes = propTypes;
FilterBar.displayName = 'FilterBar';

export default FilterBar;
