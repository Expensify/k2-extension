'use strict';
/* global console */

const React = require('react');
const prefs = require('../../lib/prefs');
const Tabs = require('../../component/tabs/tabs');
const PanelList = require('../../component/panel/list');
const Filters = require('./filters');

const StoreIssueHourly = require('../../store/issue.hourly');
const StoreIssueDaily = require('../../store/issue.daily');
const StoreIssueWeekly = require('../../store/issue.weekly');
const StoreIssueMonthly = require('../../store/issue.monthly');
const StoreIssueNone = require('../../store/issue.none');
const StorePullAssigned = require('../../store/pull.assigned');
const StorePullReviewing = require('../../store/pull.reviewing');
const StoreDailyImprovements = require('../../store/dailyimprovements');

const ActionsIssueHourly = require('../../action/issue.hourly');
const ActionsIssueDaily = require('../../action/issue.daily');
const ActionsIssueWeekly = require('../../action/issue.weekly');
const ActionsIssueMonthly = require('../../action/issue.monthly');
const ActionsIssueNone = require('../../action/issue.none');
const ActionsPullAssigned = require('../../action/pull.assigned');
const ActionsPullReviewing = require('../../action/pull.reviewing');
const ActionsDailyImprovements = require('../../action/dailyimprovements');

module.exports = React.createClass({
  propTypes: {
    pollInterval: React.PropTypes.number
  },

  /**
   * Sign out the user so they are prompted for their password again
   */
  signOut() {
    prefs.clear('ghPassword');
    window.location.reload(true);
  },

  filterIssues(filters) {
    this.tabs.refreshWithFilters(filters);
  },

  render() {
    let listOptions = {
      emptyTitle: 'No Issues Here',
      emptyText: 'You completed all issues'
    };
    return (
      <div className="issueList">

        <div className="legend">
          <button onClick={this.signOut} className="btn tooltipped tooltipped-sw" aria-label="Sign Out">Sign Out</button>
          <br />
          <br />
          <a className="btn btn-primary" aria-label="New Issue" href="https://github.com/Expensify/Expensify/issues/new/" target="_blank">New Issue</a>

          <br />
          <div className="issue reviewing">Under Review</div>
          <div className="issue overdue">Overdue</div>
          <div className="issue"><sup>I</sup> Improvement</div>
          <div className="issue"><sup>T</sup> Task</div>
          <div className="issue"><sup>F</sup> New Feature</div>
        </div>

        <div className="columns">
          <div className="one-fifth column">
            <PanelList title="Hourly" extraClass="hourly" action={ActionsIssueHourly} store={StoreIssueHourly} item="issue"
              listOptions={listOptions} pollInterval={this.props.pollInterval} />
          </div>
          <div className="one-fifth column">
            <PanelList title="Daily" extraClass="daily" action={ActionsIssueDaily} store={StoreIssueDaily} item="issue"
              listOptions={listOptions} pollInterval={this.props.pollInterval} />
          </div>
          <div className="one-fifth column">
            <PanelList title="Weekly" extraClass="weekly" action={ActionsIssueWeekly} store={StoreIssueWeekly} item="issue"
              listOptions={listOptions} pollInterval={this.props.pollInterval} />
          </div>
          <div className="one-fifth column">
            <PanelList title="Monthly" extraClass="monthly" action={ActionsIssueMonthly} store={StoreIssueMonthly} item="issue"
              listOptions={listOptions} pollInterval={this.props.pollInterval} />
          </div>
          <div className="one-fifth column">
            <PanelList title="None" extraClass="none" action={ActionsIssueNone} store={StoreIssueNone} item="issue"
              listOptions={listOptions} pollInterval={this.props.pollInterval} />
          </div>
        </div>
        <br />
        <div>
          <PanelList title="Daily Improvements (All Areas)" action={ActionsDailyImprovements} store={StoreDailyImprovements} item="issue" pollInterval={this.props.pollInterval} />
        </div>
        <br />
        <div>
          <PanelList title="Your Pull Requests" action={ActionsPullAssigned} store={StorePullAssigned} options={{showAssignee: false, showReviews: true}} item="pull" pollInterval={this.props.pollInterval} />
        </div>
        <br />
        <div>
          <PanelList title="Review Requests - You need to finish reviewing" action={ActionsPullReviewing} store={StorePullReviewing} options={{showAssignee: false, showReviews: true}} item="pull" pollInterval={this.props.pollInterval} />
        </div>
        <br />
        <Filters filter={this.filterIssues}/>
        <br />
        <div>
          <Tabs
            ref={el => this.tabs = el}
            pollInterval={15000}
            type="issue"
            items={[
              {
                title: 'Engineering',
                id: 'engineering',
                apiMethod: 'getEngineeringIssues'
              },
              {
                title: 'Integrations',
                id: 'integrations',
                apiMethod: 'getIntegrationsIssues'
              },
              {
                title: 'Scrapers',
                id: 'scrapers',
                apiMethod: 'getScrapersIssues'
              },
              {
                title: 'Area51',
                id: 'area51',
                apiMethod: 'getArea51Issues'
              },
              {
                title: 'Mobile',
                id: 'mobile',
                apiMethod: 'getMobileIssues'
              }
            ]}
          />
        </div>
      </div>
    );
  }
});
