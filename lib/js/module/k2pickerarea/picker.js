'use strict';

const $ = require('jquery');
const _ = require('underscore');
const React = require('react');
const API = require('../../lib/api');
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
    const state = {
      Engineering: {
        className: defaultBtnClass + ' inactive k2-web',
        shortName: '💻 Engineering'
      },
      'Integration Server': {
        className: defaultBtnClass + ' inactive k2-integration server tooltipped tooltipped-n',
        shortName: '📤 IS'
      },
      Design: {
        className: defaultBtnClass + ' inactive k2-design',
        shortName: '🎨 Design'
      },
      Ops: {
        className: defaultBtnClass + ' inactive k2-ops',
        shortName: '💰 Ops'
      },
      Infra: {
        className: defaultBtnClass + ' inactive k2-infra',
        shortName: '🔥 Infra'
      },
      External: {
        className: defaultBtnClass + ' inactive k2-external',
        shortName: '👥 External'
      },
      Demolition: {
        className: defaultBtnClass + ' inactive k2-demolition',
        shortName: '💣 Demolition'
      }
    };
    $('.js-issue-labels .IssueLabel').each(function() {
      const label = $(this).text().trim();
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
        <div className="btn-group-grid">
          {_.map(_.keys(this.state), label => <button key={label} className={this.state[label].className} aria-label={label} onClick={() => this.clickNSave(label)}>{this.state[label].shortName}</button>)}
        </div>
      </div>
    );
  }
});
