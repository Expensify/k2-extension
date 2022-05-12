import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import BtnGroup from '../../component/BtnGroup';
import * as API from '../../lib/api';

const defaultBtnClass = 'btn btn-sm tooltipped tooltipped-n';

class Picker extends React.Component {
    getInitialState() {
        return {
            Hourly: `${defaultBtnClass} k2-hourly`,
            Daily: `${defaultBtnClass} k2-daily`,
            Weekly: `${defaultBtnClass} k2-weekly`,
            Monthly: `${defaultBtnClass} k2-monthly`,
        };
    }

    componentDidMount() {
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        $('.js-issue-labels .IssueLabel').each((i, el) => {
            const label = $(el).text().trim();
            if (['Hourly', 'Daily', 'Weekly', 'Monthly'].indexOf(label) > -1) {
                this.setActiveLabel(label);
            }
        });
    }

    /**
     * @param {String} label
     */
    setActiveLabel(label) {
        const initialState = this.getInitialState();
        let newState = {};

        // If that label is already active, then set everything back
        // to the default (which removes all labels)
        if (this.state[label].indexOf(' active') > -1) {
            this.setState(initialState);
            return;
        }

        // Set all the proper active/inactive classes
        newState = _.mapObject(initialState, (val, key) => (key === label
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
            API.addLabels([label], () => {
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
                <label>Priority</label>
                <BtnGroup>
                    <button
                        type="button"
                        className={this.state.Hourly}
                        aria-label="Hourly"
                        onClick={() => this.clickNSave('Hourly')}
                    >
                        H
                    </button>
                    <button
                        type="button"
                        className={this.state.Daily}
                        aria-label="Daily"
                        onClick={() => this.clickNSave('Daily')}
                    >
                        D
                    </button>
                    <button
                        type="button"
                        className={this.state.Weekly}
                        aria-label="Weekly"
                        onClick={() => this.clickNSave('Weekly')}
                    >
                        W
                    </button>
                    <button
                        type="button"
                        className={this.state.Monthly}
                        aria-label="Monthly"
                        onClick={() => this.clickNSave('Monthly')}
                    >
                        M
                    </button>
                </BtnGroup>
            </div>
        );
    }
}

export default Picker;
