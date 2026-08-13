import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import {SegmentedControl, Stack, Text} from '@primer/react';
import * as API from '../../lib/api';

const priorityLabels = [
    {label: 'Hourly', text: 'H'},
    {label: 'Daily', text: 'D'},
    {label: 'Weekly', text: 'W'},
    {label: 'Monthly', text: 'M'},
];

class K2PickerPicker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeLabel: null,
        };

        this.selectLabel = this.selectLabel.bind(this);
    }

    componentDidMount() {
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        $('div[data-testid="issue-labels"] a > span').each((i, el) => {
            const label = $(el).text().trim();
            if (_.findWhere(priorityLabels, {label})) {
                this.setActiveLabel(label);
            }
        });
    }

    /**
     * @param {String} label
     */
    setActiveLabel(label) {
        this.setState(prevState => ({activeLabel: prevState.activeLabel === label ? null : label}));
    }

    /**
     * @param {String} label
     */
    clickNSave(label) {
        this.saveNewLabel(label);
        this.setActiveLabel(label);
    }

    /**
     * @param {String} label
     */
    saveNewLabel(label) {
        const previousLabel = this.state.activeLabel;
        if (label !== previousLabel) {
            API.addLabel(label)
                .then(() => {
                    if (!previousLabel) {
                        return;
                    }
                    API.removeLabel(previousLabel);
                });
        } else {
            API.removeLabel(label);
        }
    }

    /**
     * @param {Number} index
     */
    selectLabel(index) {
        const priority = priorityLabels[index];
        const label = priority ? priority.label : this.state.activeLabel;
        if (label) {
            this.clickNSave(label);
        }
    }

    render() {
        return (
            <Stack gap="condensed">
                <Text className="k2-sidebar-label" weight="semibold">Priority</Text>
                <SegmentedControl aria-label="Priority" fullWidth onChange={this.selectLabel} size="small">
                    {_.map(priorityLabels, priority => (
                        <SegmentedControl.Button key={priority.label} selected={this.state.activeLabel === priority.label} title={priority.label}>
                            {priority.text}
                        </SegmentedControl.Button>
                    ))}
                    <SegmentedControl.Button selected={!this.state.activeLabel} title="No priority">None</SegmentedControl.Button>
                </SegmentedControl>
            </Stack>
        );
    }
}

export default K2PickerPicker;
