'use strict';

const React = require('react');
const _ = require('underscore');
const PanelListRaw = require('../../component/panel/list.raw');

module.exports = React.createClass({
  propTypes: {
    pollInterval: React.PropTypes.number
  },

  getInitialState() {
    return this.props.store.getState();
  },

  componentDidMount() {
    this.fetch();

    // Listen to our store
    this.props.store.listen(this.onStoreChange);
  },

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Stop listening to our store
    this.props.store.unlisten(this.onStoreChange);
  },

  onStoreChange() {
    // Update our state when the store changes
    this.setState(this.props.store.getState());
  },

  fetch() {
    this.props.action.fetch();

    if (this.props.pollInterval && !this.interval) {
      this.interval = setInterval(this.fetch, this.props.pollInterval);
    }
  },

  render() {
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

    if (!this.state.data.length) {
      return (
        <div className="blankslate capped clean-background">
          No items
        </div>
      );
    }

    return (
      <div className="columns">
        <div className="one-fifth column">
          <PanelListRaw
            title="Hourly"
            extraClass="hourly"
            item="issue"
            data={this.state.data.filter(row => _(row.labels).findWhere({name: 'Hourly'}))}
          />
        </div>
        <div className="one-fifth column">
          <PanelListRaw
            title="Daily"
            extraClass="daily"
            item="issue"
            data={this.state.data.filter(row => _(row.labels).findWhere({name: 'Daily'}))}
          />
        </div>
        <div className="one-fifth column">
          <PanelListRaw
            title="Weekly"
            extraClass="weekly"
            item="issue"
            data={this.state.data.filter(row => _(row.labels).findWhere({name: 'Weekly'}))}
          />
        </div>
        <div className="one-fifth column">
          <PanelListRaw
            title="Monthly"
            extraClass="monthly"
            item="issue"
            data={this.state.data.filter(row => _(row.labels).findWhere({name: 'Monthly'}))}
          />
        </div>
        <div className="one-fifth column">
          <PanelListRaw
            title="None"
            extraClass="none"
            item="issue"
            data={this.state.data.filter(row => _.intersection(row.labels.map(label => label.name), ['Hourly', 'Daily', 'Weekly', 'Monthly']).length === 0)}
          />
        </div>
      </div>
    );
    // return (
    //   <div className="columns">
    //     <div className="one-fifth column">
    //       <PanelList
    //         title="Hourly"
    //         extraClass="hourly"
    //         action={ActionsIssueHourly}
    //         store={StoreIssueHourly}
    //         item="issue"
    //         listOptions={listOptions}
    //         pollInterval={this.props.pollInterval}
    //       />
    //     </div>
    //     <div className="one-fifth column">
    //       <PanelList
    //         title="Daily"
    //         extraClass="daily"
    //         action={ActionsIssueDaily}
    //         store={StoreIssueDaily}
    //         item="issue"
    //         listOptions={listOptions}
    //         pollInterval={this.props.pollInterval}
    //       />
    //     </div>
    //     <div className="one-fifth column">
    //       <PanelList
    //         title="Weekly"
    //         extraClass="weekly"
    //         action={ActionsIssueWeekly}
    //         store={StoreIssueWeekly}
    //         item="issue"
    //         listOptions={listOptions}
    //         pollInterval={this.props.pollInterval}
    //       />
    //     </div>
    //     <div className="one-fifth column">
    //       <PanelList
    //         title="Monthly"
    //         extraClass="monthly"
    //         action={ActionsIssueMonthly}
    //         store={StoreIssueMonthly}
    //         item="issue"
    //         listOptions={listOptions}
    //         pollInterval={this.props.pollInterval}
    //       />
    //     </div>
    //     <div className="one-fifth column">
    //       <PanelList
    //         title="None"
    //         extraClass="none"
    //         action={ActionsIssueNone}
    //         store={StoreIssueNone}
    //         item="issue"
    //         listOptions={listOptions}
    //         pollInterval={this.props.pollInterval}
    //       />
    //     </div>
    //   </div>
    // );
  }
});