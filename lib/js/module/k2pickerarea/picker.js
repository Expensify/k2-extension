'use strict';
/* global console */

const $ = require('jquery');
const _ = require('underscore');
const React = require('react');
const API = require('../../lib/api');
const BtnGroup = require('../../component/btngroup/index');
const defaultBtnClass = 'btn btn-sm tooltipped tooltipped-n typepicker';

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
    const state = {
      engineering: defaultBtnClass + ' inactive k2-web',
      'area-51': defaultBtnClass + ' inactive k2-area-51',
      design: defaultBtnClass + ' inactive k2-design',
      'integration server': defaultBtnClass + ' inactive k2-integration server',
      ops: defaultBtnClass + ' inactive k2-ops',
      scraper: defaultBtnClass + ' inactive k2-scraper',
      mobile: defaultBtnClass + ' inactive k2-mobile'
    };
    $('.labels .label').each(function() {
      const label = $(this).text().toLowerCase();
      if (state[label]) {
        state[label] = state[label].replace('inactive', 'active');
      }
    });
    return state;
  },

  clickNSave(label) {
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
    let newState = _.clone(this.state);

    if (newState[label].search('inactive') > -1) {
      newState[label] = newState[label].replace('inactive', 'active');
      API.addLabels([label]);
    } else {
      newState[label] = newState[label].replace('active', 'inactive');
      API.removeLabel(label);
    }

    this.setState(newState);
  },
  render() {
    return (
      <div>
        <label>Area</label>
        <BtnGroup>
          {_(_(this.state).keys()).map(label => <button key={label} className={this.state[label]} aria-label={label} onClick={() => this.clickNSave(label)}>{label[0].toUpperCase()}</button>)}
        </BtnGroup>
      </div>
    );
  }
});
