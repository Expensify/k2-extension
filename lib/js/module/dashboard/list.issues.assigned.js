'use strict';
/* global console */

const React = require('react');
const PanelList = require('../../component/panel/list');

module.exports = React.createClass({
  propTypes: {
    pollInterval: React.PropTypes.number
  },
  fetched: false,
  componentDidMount() {
    if (!this.fetched) {
      this.fetch();
    }
    if (this.props.pollInterval && !this.interval) {
      this.interval = setInterval(this.fetch, this.props.pollInterval);
    }
  },

  componentDidUpdate() {
    if (!this.fetched) {
      this.fetch();
    }
    if (this.props.pollInterval && !this.interval) {
      this.interval = setInterval(this.fetch, this.props.pollInterval);
    }
  },

  componentWillUnmount() {
    clearInterval(this.interval);
  },

  fetch() {
    if (this.props.action) {
      this.props.action.fetch();
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
      <div>
        Hi
      </div>
    );

    let listOptions = {
      emptyTitle: 'No Issues Here',
      emptyText: 'You completed all issues'
    };
    console.log(this.state, this.props);
    return null;
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
