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
      hourly: defaultBtnClass + ' k2-hourly',
      daily: defaultBtnClass + ' k2-daily',
      weekly: defaultBtnClass + ' k2-weekly',
      monthly: defaultBtnClass + ' k2-monthly'
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
      switch ($(this).text().toLowerCase()) {
      case 'hourly': _this.setHourly(); break;
      case 'daily': _this.setDaily(); break;
      case 'weekly': _this.setWeekly(); break;
      case 'monthly': _this.setMonthly(); break;
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

  clickHourly() {
    this._saveNewLabel('hourly');
    this.setHourly();
  },

  clickDaily() {
    this._saveNewLabel('daily');
    this.setDaily();
  },
  clickWeekly() {
    this._saveNewLabel('weekly');
    this.setWeekly();
  },
  clickMonthly() {
    this._saveNewLabel('monthly');
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
    this._setActiveLabel('hourly');
  },

  /**
   * Enable the daily label
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   */
  setDaily() {
    this._setActiveLabel('daily');
  },

  /**
   * Enable the weekly label
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   */
  setWeekly() {
    this._setActiveLabel('weekly');
  },

  /**
   * Enable the monthly label
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-07-30
   */
  setMonthly() {
    this._setActiveLabel('monthly');
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
        ? defaultBtnClass + ' k2-' + key + ' active'
        : defaultBtnClass + ' k2-' + key + ' inactive';
    });
    this.setState(newState);
  },
  render() {
    return (
      <div>
        <label>Priority</label>
        <BtnGroup>
          <button className={this.state.hourly} aria-label="Hourly" onClick={this.clickHourly}>H</button>
          <button className={this.state.daily} aria-label="Daily" onClick={this.clickDaily}>D</button>
          <button className={this.state.weekly} aria-label="Weekly" onClick={this.clickWeekly}>W</button>
          <button className={this.state.monthly} aria-label="Monthly" onClick={this.clickMonthly}>M</button>
        </BtnGroup>
      </div>
    );
  }
});
