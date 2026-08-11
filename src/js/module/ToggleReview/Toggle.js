import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import {Stack, ToggleSwitch} from '@primer/react';
import * as API from '../../lib/api';

class Toggle extends React.Component {
    constructor(props) {
        super(props);
        this.initialState = {
            Reviewing: false,
        };
        this.state = this.initialState;
    }

    componentDidMount() {
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        $('div[data-testid="issue-labels"] a > span').each((i, el) => {
            const label = $(el).text().trim();
            if (['Reviewing'].indexOf(label) > -1) {
                this.setActiveLabel(label);
            }
        });
    }

    /**
     * @param {String} label
     */
    setActiveLabel(label) {
        let newState = {};

        // If that label is already active, then set everything back
        // to the default (which removes all labels)
        if (this.state[label]) {
            this.setState(this.initialState);
            return;
        }

        // Set the active label
        newState = _.mapObject(this.initialState, (val, key) => (key === label
            ? true
            : val));
        this.setState(newState);
    }

    /**
     * @param {String} label
     */
    saveNewLabel(label) {
        let previousLabel = null;
        _.each(this.state, (val, key) => {
            if (!val) {
                return;
            }
            previousLabel = key;
        });
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
     * @param {String} label
     */
    clickNSave(label) {
        this.saveNewLabel(label);
        this.setActiveLabel(label);
    }

    render() {
        return (
            <Stack direction="horizontal" align="center" justify="space-between" gap="condensed">
                <span id="k2-reviewing-label">Reviewing label</span>
                <ToggleSwitch
                    aria-labelledby="k2-reviewing-label"
                    checked={this.state.Reviewing}
                    onChange={() => this.clickNSave('Reviewing')}
                    size="small"
                />
            </Stack>
        );
    }
}

export default Toggle;
