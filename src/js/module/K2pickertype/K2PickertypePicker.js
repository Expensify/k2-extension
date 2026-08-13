import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import {SegmentedControl, Stack, Text} from '@primer/react';
import * as API from '../../lib/api';

const typeLabels = [
    {label: 'Improvement', text: 'Improve'},
    {label: 'Task', text: 'Task'},
    {label: 'NewFeature', text: 'Feature'},
];

class K2PickertypePicker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeLabel: null,
        };

        this.selectLabel = this.selectLabel.bind(this);
    }

    /**
     * When the component has renered, we need to see if there
     * is an existing label, and if so, make that button enabled
     *
     * @date 2015-07-30
     */
    componentDidMount() {
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        $('div[data-testid="issue-labels"] a > span').each((i, el) => {
            const label = $(el).text().trim();
            if (_.findWhere(typeLabels, {label})) {
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
        const selectedType = typeLabels[index];
        const label = selectedType ? selectedType.label : this.state.activeLabel;
        if (label) {
            this.clickNSave(label);
        }
    }

    render() {
        return (
            <Stack gap="condensed">
                <Text className="k2-sidebar-label" weight="semibold">Type</Text>
                <SegmentedControl aria-label="Type" fullWidth onChange={this.selectLabel} size="small">
                    {_.map(typeLabels, type => (
                        <SegmentedControl.Button key={type.label} selected={this.state.activeLabel === type.label} title={type.label === 'NewFeature' ? 'New Feature' : type.label}>
                            {type.text}
                        </SegmentedControl.Button>
                    ))}
                    <SegmentedControl.Button selected={!this.state.activeLabel} title="No type">None</SegmentedControl.Button>
                </SegmentedControl>
            </Stack>
        );
    }
}

export default K2PickertypePicker;
