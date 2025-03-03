import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import BtnGroup from '../../component/BtnGroup';
import * as API from '../../lib/api';

const defaultBtnClass = 'btn btn-sm tooltipped tooltipped-n typepicker';

class K2PickertypePicker extends React.Component {
    constructor(props) {
        super(props);
        this.initialState = {
            Improvement: `${defaultBtnClass} k2-improvement`,
            Task: `${defaultBtnClass} k2-task`,
            NewFeature: `${defaultBtnClass} k2-newfeature`,
        };
        this.state = this.initialState;
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
            if (['Improvement', 'Task', 'NewFeature'].indexOf(label) > -1) {
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
        if (this.state[label].indexOf(' active') > -1) {
            this.setState(this.initialState);
            return;
        }

        // Set all the proper active/inactive classes
        newState = _.mapObject(this.initialState, (val, key) => (key === label
            ? `${defaultBtnClass} k2-${key.toLowerCase()} active`
            : `${defaultBtnClass} k2-${key.toLowerCase()} inactive`));
        this.setState(newState);
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
        let previousLabel = null;
        _.each(this.state, (val, key) => {
            if (val.search('active') <= -1 || val.search('inactive') !== -1) {
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

    render() {
        return (
            <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>Type</label>
                <BtnGroup>
                    <button
                        type="button"
                        className={this.state.Improvement}
                        aria-label="Improvement"
                        onClick={() => this.clickNSave('Improvement')}
                    >
                        Improv.
                    </button>
                    <button
                        type="button"
                        className={this.state.Task}
                        aria-label="Task"
                        onClick={() => this.clickNSave('Task')}
                    >
                        Task
                    </button>
                    <button
                        type="button"
                        className={this.state.NewFeature}
                        aria-label="New Feature"
                        onClick={() => this.clickNSave('NewFeature')}
                    >
                        New Feat.
                    </button>
                </BtnGroup>
            </div>
        );
    }
}

export default K2PickertypePicker;
