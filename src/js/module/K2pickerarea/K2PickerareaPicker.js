import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import * as API from '../../lib/api';

const defaultBtnClass = 'btn btn-sm';

class K2PickerareaPicker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Engineering: {
                className: `${defaultBtnClass} inactive k2-web`,
                shortName: '💻 Engineering',
            },
            'Integration Server': {
                className: `${defaultBtnClass} inactive k2-integration-server tooltipped tooltipped-n`,
                shortName: '📤 IS',
            },
            Design: {
                className: `${defaultBtnClass} inactive k2-design`,
                shortName: '🎨 Design',
            },
            Infra: {
                className: `${defaultBtnClass} inactive k2-infra`,
                shortName: '🚨 Infra',
            },
            External: {
                className: `${defaultBtnClass} inactive k2-external`,
                shortName: '👥 External',
            },
            'Hot Pick': {
                className: `${defaultBtnClass} inactive k2-hot-pick`,
                shortName: '🔥 Hot Pick',
            },
        };
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        $('div[data-testid="issue-labels"] a > span').each((i, el) => {
            const label = $(el).text().trim();
            if (this.state[label]) {
                this.state[label].className = this.state[label].className.replace('inactive', 'active');
            }
        });
    }

    /**
     * Sets a single label to be active (or if already active, then turns all of them off)
     *
     * @date 2015-07-30
     *
     * @param {String} label
     */
    setActiveLabel(label) {
        const newState = _.clone(this.state);

        if (newState[label].className.search('inactive') > -1) {
            newState[label].className = newState[label].className.replace('inactive', 'active');
            API.addLabel(label);
        } else {
            newState[label].className = newState[label].className.replace('active', 'inactive');
            API.removeLabel(label);
        }

        this.setState(newState);
    }

    clickNSave(label) {
        this.setActiveLabel(label);
    }

    render() {
        return (
            <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>Area</label>
                <div className="btn-group-grid">
                    {_.map(_.keys(this.state), label => (
                        <button
                            type="button"
                            key={label}
                            className={this.state[label].className}
                            aria-label={label}
                            onClick={() => this.clickNSave(label)}
                        >
                            {this.state[label].shortName}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
}

export default K2PickerareaPicker;
