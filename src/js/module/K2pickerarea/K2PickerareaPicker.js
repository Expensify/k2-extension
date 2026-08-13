import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import {
    ActionList, ActionMenu, Stack, Text,
} from '@primer/react';
import * as API from '../../lib/api';

const areaLabels = [
    {label: 'Engineering', text: 'Engineering'},
    {label: 'Integration Server', text: 'Integration Server'},
    {label: 'Design', text: 'Design'},
    {label: 'Infra', text: 'Infra'},
    {label: 'External', text: 'External'},
    {label: 'Hot Pick', text: 'Hot Pick'},
    {label: 'Concierge (dont reopen)', text: 'Concierge'},
];

class K2PickerareaPicker extends React.Component {
    constructor(props) {
        super(props);

        const selectedLabels = {
            Engineering: false,
            'Integration Server': false,
            Design: false,
            Infra: false,
            External: false,
            'Hot Pick': false,
            'Concierge (dont reopen)': false,
        };
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        $('div[data-testid="issue-labels"] a > span').each((i, el) => {
            const label = $(el).text().trim();
            if (_.has(selectedLabels, label)) {
                selectedLabels[label] = true;
            }
        });

        this.state = {
            selectedLabels,
        };
    }

    /**
     * Sets whether a single label is active.
     *
     * @date 2015-07-30
     *
     * @param {String} label
     * @param {Boolean} isActive
     */
    setActiveLabel(label, isActive) {
        if (isActive) {
            API.addLabel(label);
        } else {
            API.removeLabel(label);
        }

        this.setState(prevState => ({
            selectedLabels: {
                ...prevState.selectedLabels,
                [label]: isActive,
            },
        }));
    }

    clickNSave(label, isActive) {
        this.setActiveLabel(label, isActive);
    }

    render() {
        const selectedCount = _.filter(_.values(this.state.selectedLabels), Boolean).length;

        return (
            <Stack gap="condensed">
                <Text className="k2-sidebar-label" weight="semibold">Area</Text>
                <ActionMenu>
                    <ActionMenu.Button className="k2-sidebar-menu-button">
                        {selectedCount ? `Areas (${selectedCount})` : 'Choose areas'}
                    </ActionMenu.Button>
                    <ActionMenu.Overlay width="medium">
                        <ActionList selectionVariant="multiple" aria-label="Issue areas">
                            {_.map(areaLabels, area => (
                                <ActionList.Item
                                    key={area.label}
                                    selected={this.state.selectedLabels[area.label]}
                                    onSelect={() => this.clickNSave(area.label, !this.state.selectedLabels[area.label])}
                                    role="menuitemcheckbox"
                                    aria-checked={this.state.selectedLabels[area.label]}
                                >
                                    {area.text}
                                </ActionList.Item>
                            ))}
                        </ActionList>
                    </ActionMenu.Overlay>
                </ActionMenu>
            </Stack>
        );
    }
}

export default K2PickerareaPicker;
