'use strict';

/**
 * A component for tabs to show the selected tab and the corresponding content
 */

const $ = require('jquery');
const React = require('react');
const _ = require('underscore');
const Prefs = require('../../lib/prefs');
const API = require('../../lib/api');
const ListItemIssue = require('../list-item/issue');
const ListItemPull = require('../list-item/pull');
const ListItemForm = require('../list-item/form');

module.exports = React.createClass({
  fetched: false,
  getInitialState() {
    return {
      error: null,
      loading: true,
      retrying: false,
      retryingIn: 0,
      data: []
    };
  },

  componentDidMount() {
    this.loadData();
  },

  componentDidUpdate() {
    this.loadData();
  },

  componentWillReceiveProps(nextProps) {
    // Reset our fetched flag if our API method changed
    this.fetched = this.props.apiMethod === nextProps.apiMethod;
    if (!this.fetched) {
      this.setState({
        loading: true,
        retrying: false,
        error: null
      });
    }
  },

  loadData() {
    // Don't load any data if we have already fetched it
    if (this.fetched) {
      return;
    }

    if (!API[this.props.apiMethod]) {
      throw new Error(`The method ${this.props.apiMethod} does not exist on the API module`);
    }

    this.callApi();

    this.fetched = true;
  },

  callApi() {
    clearInterval(this.interval);
    API[this.props.apiMethod]((error, data) => {
      if (error) {
        return this.setState({
          error: 'There was an error loading data. Refresh the page to try again.',
          loading: false,
          retrying: false
        });
      }

      this.unfilteredData = data;

      // Update the tab counter
      $(`[data-key="${this.props.apiMethod}"] .Counter`).html(data.length);

      // Apply issue filters if we need to
      Prefs.get('issueFilters', issueFilters => {
        let filteredData = data;
        if (this.props.type === 'issue' && issueFilters && !_.isEmpty(issueFilters)) {
          filteredData = this.filterData(issueFilters);
        }

        this.setState({
          loading: false,
          retrying: false,
          data: filteredData
        });

        if (this.props.pollInterval) {
          this.interval = setInterval(this.callApi, this.props.pollInterval);
        }
      });
    }, data => {
      // Handle the API retrying
      this.setState({
        loading: false,
        retrying: true,
        retryingIn: Math.round(data / 1000)
      });
    });
  },

  /**
   * Refreshes our data with the given filters
   * @public
   * @param {Object} filters
   */
  refreshWithFilters(filters) {
    if (this.state.loading || this.state.retrying) {
      return;
    }

    if (filters && !_.isEmpty(filters)) {
      this.setState({
        data: this.filterData(filters)
      });
    }
  },

  filterData(filters) {
    return _.filter(this.unfilteredData, item => {
      const isImprovement = _.findWhere(item.labels, {name: 'Improvement'});
      const isTask = _.findWhere(item.labels, {name: 'Task'});
      const isFeature = _.findWhere(item.labels, {name: 'NewFeature'});
      const isOnMilestone = item.milestone && item.milestone.id.toString() === filters.milestone;
      // If we are filtering on milestone, remove everything not on that milestone
      if (filters.milestone && !isOnMilestone) {
        return false;
      }
      return (filters.improvement && isImprovement)
        || (filters.task && isTask)
        || (filters.feature && isFeature);
    });
  },

  render: function() {
    if (this.state.error) {
      return (
        <div className="panel">
          <div className="blankslate capped clean-background">Error: {this.state.error}</div>
        </div>
      );
    }

    if (this.state.loading) {
      return (
        <div className="panel">
          <div className="blankslate capped clean-background">Loading...</div>
        </div>
      );
    }

    if (this.state.retrying) {
      return (
        <div className="panel">
          <div className="blankslate capped clean-background">Retrying in {this.state.retryingIn} seconds</div>
        </div>
      );
    }

    return (
      <div className="panel">
        <div>
          {_.map(this.state.data, item => {
            let result;
            switch (this.props.type) {
            case 'issue': result = <ListItemIssue key={item.id} data={item} />; break;
            case 'pull': result = <ListItemPull key={item.id} data={item} />; break;
            case 'form': result = <ListItemForm key={item.id} data={item} />; break;
            }
            return result;
          })}
        </div>
      </div>
    );
  }
});
