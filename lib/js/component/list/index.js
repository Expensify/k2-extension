'use strict';

/**
 * List
 *
 * Display a list of items depending on the type
 *
 * @param {array} data which will be displayed as items
 * @param {object} options
 */

let _ = require('underscore');
let React = require('react');
let ListItemIssue = require('../list-item/issue');
let ListItemPull = require('../list-item/pull');
let ListItemForm = require('../list-item/form');

module.exports = React.createClass({
  getInitialState() {
    if (!this.props.store) {
      return {data: this.props.data};
    }
    return this.props.store.getState();
  },

  fetch() {
    if (this.props.action) {
      this.props.action.fetch();
    }
  },

  componentDidMount() {
    // Listen to our store
    if (this.props.store) {
      this.props.store.listen(this.onStoreChange);
    }
  },

  componentWillUnmount() {
    if (this.props.store) {
      // Stop listening to our store
      this.props.store.unlisten(this.onStoreChange);
    }
  },

  onStoreChange() {
    if (this.props.store) {
      // Update our state when the store changes
      this.setState(this.props.store.getState());
    }
  },

  /**
   * Gets the items to display using the proper item
   * component
   *
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-06-10
   *
   * @return {array}
   */
  _getItems: function() {
    let type = this.props.type;
    let options = this.props.options;

    return this.state.data.map(function(item) {
      let result;
      switch (type) {
      case 'issue': result = (<ListItemIssue key={`issue_${item.id}`} data={item} options={options} />); break;
      case 'pull': result = (<ListItemPull key={`pull_${item.id}`} data={item} options={options} />); break;
      case 'review': result = (<ListItemPull key={`review_${item.id}`} data={item} options={options} />); break;
      case 'form': result = (<ListItemForm key={`form_${item.id}`} data={item} options={options} />); break;
      }
      return result;
    });
  },

  render: function() {
    if (this.state.loading) {
      return (
        <div className="blankslate capped clean-background">
          Loading
        </div>
      );
    }

    if (this.state.retrying) {
      return (
        <div className="blankslate capped clean-background">
          Automatically retrying in x seconds
        </div>
      );
    }

    if (!_.size(this.state.data)) {
      return (
        <div className="blankslate capped clean-background">
          No items
        </div>
      );
    }
    return (
      <div>
        {this._getItems()}
      </div>
    );
  }
});
