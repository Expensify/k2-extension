'use strict';
/* global console */

const $ = require('jquery');
const _ = require('underscore');
const React = require('react');
const API = require('../../lib/api');
const BtnGroup = require('../../component/btngroup/index');
const defaultBtnClass = 'btn btn-sm tooltipped tooltipped-n';

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
      Hourly: defaultBtnClass + ' k2-hourly',
      Daily: defaultBtnClass + ' k2-daily',
      Weekly: defaultBtnClass + ' k2-weekly',
      Monthly: defaultBtnClass + ' k2-monthly'
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
    let _this = this;
    $('.labels .label').each(function() {
      switch ($(this).text()) {
      case 'Hourly': _this.setHourly(); break;
      case 'Daily': _this.setDaily(); break;
      case 'Weekly': _this.setWeekly(); break;
      case 'Monthly': _this.setMonthly(); break;
      }
    });
  },

  _saveNewLabel(label) {
    let previousLabel = null;
    _(this.state).each((val, key) => {
      if (val.search('active') > -1 && val.search('inactive') === -1) {
        previousLabel = key;
      }
    });
    if (label.toLowerCase() !== previousLabel.toLowerCase()) {
      API.addLabels([label], () => {
        if (previousLabel) {
          API.removeLabel(previousLabel);
        }
      });
    } else {
      API.removeLabel(label);
    }
  },

  clickHourly() {
    this._saveNewLabel('Hourly');
    this.setHourly();
  },

  clickDaily() {
    this._saveNewLabel('Daily');
    this.setDaily();
  },
  clickWeekly() {
    this._saveNewLabel('Weekly');
    this.setWeekly();
  },
  clickMonthly() {
    this._saveNewLabel('Monthly');
    this.setMonthly();
  },

  /**
   * Enable the hourly label
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   */
  setHourly() {
    this._setActiveLabel('Hourly');
  },

  /**
   * Enable the daily label
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   */
  setDaily() {
    this._setActiveLabel('Daily');
  },

  /**
   * Enable the weekly label
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   */
  setWeekly() {
    this._setActiveLabel('Weekly');
  },

  /**
   * Enable the monthly label
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   */
  setMonthly() {
    this._setActiveLabel('Monthly');
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
    if (this.state[label].indexOf(' active') > -1) {
      this.setState(initialState);
      return;
    }

    // Set all the proper active/inactive classes
    newState = _(initialState).mapObject((val, key) => {
      return key === label
        ? defaultBtnClass + ' k2-' + key.toLowerCase() + ' active'
        : defaultBtnClass + ' k2-' + key.toLowerCase() + ' inactive';
    });
    this.setState(newState);
  },
  render() {
    return (
      <div>
        <label>Priority</label>
        <BtnGroup>
          <button className={this.state.Hourly} aria-label="Hourly" onClick={this.clickHourly}>H</button>
          <button className={this.state.Daily} aria-label="Daily" onClick={this.clickDaily}>D</button>
          <button className={this.state.Weekly} aria-label="Weekly" onClick={this.clickWeekly}>W</button>
          <button className={this.state.Monthly} aria-label="Monthly" onClick={this.clickMonthly}>M</button>
        </BtnGroup>
      </div>
    );
  }
});
