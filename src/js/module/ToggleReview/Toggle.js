import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import BtnGroup from '../../component/BtnGroup';
import * as API from '../../lib/api';

const defaultBtnClass = 'btn btn-sm';

class Toggle extends React.Component {
    constructor(props) {
        super(props);
        this.initialState = {
            Reviewing: `${defaultBtnClass} k2-reviewing`,
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
        if (this.state[label].indexOf(' selected') > -1) {
            this.setState(this.initialState);
            return;
        }

        // Set all the proper active/inactive classes
        newState = _.mapObject(this.initialState, (val, key) => (key === label
            ? `${defaultBtnClass} k2-${key.toLowerCase()} selected`
            : `${defaultBtnClass} k2-${key.toLowerCase()}`));
        this.setState(newState);
    }

    /**
     * @param {String} label
     */
    saveNewLabel(label) {
        let previousLabel = null;
        _.each(this.state, (val, key) => {
            if (val.search('selected') <= -1) {
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
            <div>
                <BtnGroup>
                    <button
                        type="button"
                        className={this.state.Reviewing}
                        onClick={() => this.clickNSave('Reviewing')}
                    >
                        {(this.state.Reviewing.indexOf('selected') > -1)
                            ? 'Remove "Reviewing" Label'
                            : 'Add "Reviewing" Label'}
                    </button>
                </BtnGroup>
            </div>
        );
    }
}

export default Toggle;
