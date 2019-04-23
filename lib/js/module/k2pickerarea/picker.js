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
   * Sets the initial className names for all of our buttons
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   *
   * @return {Object}
   */
  getInitialState() {
    const state = {
      Engineering: {
        className: defaultBtnClass + ' inactive k2-web',
        shortName: '💻'
      },
      Design: {
        className: defaultBtnClass + ' inactive k2-design',
        shortName: '🎨'
      },
      'Integration Server': {
        className: defaultBtnClass + ' inactive k2-integration server',
        shortName: '📤'
      },
      Ops: {
        className: defaultBtnClass + ' inactive k2-ops',
        shortName: '💰'
      },
      Scraper: {
        className: defaultBtnClass + ' inactive k2-scraper',
        shortName: '💳'
      },
      Mobile: {
        className: defaultBtnClass + ' inactive k2-mobile',
        shortName: '📱'
      },
      Infra: {
        className: defaultBtnClass + ' inactive k2-infra',
        shortName: '🔥'
      }
    };
    $('.labels .IssueLabel').each(function() {
      const label = $(this).text();
      if (state[label]) {
        state[label].className = state[label].className.replace('inactive', 'active');
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

    if (newState[label].className.search('inactive') > -1) {
      newState[label].className = newState[label].className.replace('inactive', 'active');
      API.addLabels([label]);
    } else {
      newState[label].className = newState[label].className.replace('active', 'inactive');
      API.removeLabel(label);
    }

    this.setState(newState);
  },
  render() {
    return (
      <div>
        <label>Area</label>
        <BtnGroup>
          {_(_(this.state).keys()).map(label => <button key={label} className={this.state[label].className} aria-label={label} onClick={() => this.clickNSave(label)}>{this.state[label].shortName.toUpperCase()}</button>)}
        </BtnGroup>
      </div>
    );
  }
});
