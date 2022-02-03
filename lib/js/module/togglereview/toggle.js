
const $ = require('jquery');
const _ = require('underscore');
const React = require('react');
const API = require('../../lib/api');
const BtnGroup = require('../../component/btngroup/index');

const defaultBtnClass = 'btn btn-sm';

module.exports = React.createClass({
    /**
   * Sets the initial class names for all of our buttons
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   *
   * @return {Object}
   */
    getInitialState() {
        return {
            Reviewing: `${defaultBtnClass} k2-reviewing`,
        };
    },

    /**
   * When the component has renered, we need to see if there
   * is an existing label, and if so, make that button enabled
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   */
    componentDidMount() {
        const _this = this;
        $('.js-issue-labels .IssueLabel').each(function () {
            const label = $(this).text().trim();
            if (['Reviewing'].indexOf(label) > -1) {
                _this._setActiveLabel(label);
            }
        });
    },

    _saveNewLabel(label) {
        let previousLabel = null;
        _.each(this.state, (val, key) => {
            if (val.search('selected') > -1) {
                previousLabel = key;
            }
        });
        if (label !== previousLabel) {
            API.addLabels([label], () => {
                if (previousLabel) {
                    API.removeLabel(previousLabel);
                }
            });
        } else {
            API.removeLabel(label);
        }
    },

    clickNSave(label) {
        this._saveNewLabel(label);
        this._setActiveLabel(label);
    },

    /**
   * Sets a single label to be active (or if already active, then turns all of them off)
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   *
   * @param {String} label
   */
    _setActiveLabel(label) {
        const initialState = this.getInitialState();
        let newState = {};

        // If that label is already active, then set everything back
        // to the default (which removes all labels)
        if (this.state[label].indexOf(' selected') > -1) {
            this.setState(initialState);
            return;
        }

        // Set all the proper active/inactive classes
        newState = _.mapObject(initialState, (val, key) => (key === label
            ? `${defaultBtnClass} k2-${key.toLowerCase()} selected`
            : `${defaultBtnClass} k2-${key.toLowerCase()}`));
        this.setState(newState);
    },

    render() {
        return (
            <div>
                <BtnGroup>
                    <button className={this.state.Reviewing} onClick={() => this.clickNSave('Reviewing')}>
                        {(this.state.Reviewing.indexOf('selected') > -1) ? 'Remove "Reviewing" Label' : 'Add "Reviewing" Label'}
                    </button>
                </BtnGroup>
            </div>
        );
    },
});
