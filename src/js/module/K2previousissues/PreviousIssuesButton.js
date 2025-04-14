import React from 'react';
import _ from 'underscore';
import moment from 'moment';
import BtnGroup from '../../component/BtnGroup';
import * as API from '../../lib/api';

const previousIssueButtons = [
    {
        title: 'Previous Version (-1M)',
        ariaLabel: 'one month ago',
        monthsAgo: 1,
    },
    {
        title: 'Previous Version (-3M)',
        ariaLabel: 'three months ago',
        monthsAgo: 3,
    },
];

class PreviousIssuesButtons extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
        };
    }

    openIssue(monthsAgo) {
        API.getCurrentIssueDescription()
            .then((issueTitleResponse) => {
                const ghTitle = issueTitleResponse.data.title;
                const searchParts = ghTitle.match(/\[.*\] (Accounting \w+ Close) (\w{3} \d{4}) (.*) \[.*\]/);
                if (!searchParts) {
                    console.debug('Found no search parts in issue title:', ghTitle);
                    return;
                }

                // Some of the capture groups are throw aways, so we need to select the ones we actually want to search.
                const filteredSearchParts = [];
                filteredSearchParts.push(searchParts[1]);
                filteredSearchParts.push(searchParts[3]);

                const currentMonth = moment(searchParts[2], 'MMM YYYY').toDate();
                const previousMonth = new Date(currentMonth);
                previousMonth.setMonth(previousMonth.getMonth() - monthsAgo);
                const previousMonthFormatted = moment(previousMonth).format('MMM YYYY');
                console.debug('Current month:', currentMonth);
                console.debug('Previous month formatted:', previousMonthFormatted);

                return API.getPreviousInstancesOfIssue(filteredSearchParts)
                    .then((previousIssuesResponse) => {
                        // console.debug('Previous issues response:', previousIssuesResponse);
                        if (!previousIssuesResponse || _.isEmpty(previousIssuesResponse)) {
                            console.debug('No previous issues found');
                            return;
                        }

                        // Convert object response to array of issues
                        const issues = _.values(previousIssuesResponse);

                        const matchingIssue = _.find(issues, issue => _.has(issue, 'milestone')
                            && _.has(issue.milestone, 'title')
                            && issue.milestone.title.includes(previousMonthFormatted));

                        console.debug('Matching issue:', matchingIssue);

                        // Use matching issue if found, otherwise use the first issue
                        const previousGithubIssueURL = matchingIssue ? matchingIssue.url : (issues[0] && issues[0].url);

                        if (previousGithubIssueURL) {
                            window.open(previousGithubIssueURL, '_blank', 'noopener,noreferrer');
                        }
                    });
            })
            .catch((error) => {
                console.error('Error fetching previous issues:', error);
            });
    }

    render() {
        return (
            <div>
                <BtnGroup isVertical>
                    <button
                        type="button"
                        className={(this.state.isOpen) ? 'btn btn-sm selected' : 'btn btn-sm'}
                        onClick={() => this.setState(prevState => ({isOpen: !prevState.isOpen}))}
                    >
                        <span role="img" aria-label="previous issues shortcuts">
                            Previous Issues Shortcuts
                            {' '}
                            {this.state.isOpen ? '⬆️' : '⬇️'}
                        </span>
                    </button>

                    {this.state.isOpen && (
                        _.map(previousIssueButtons, (previousIssueButton, index) => (
                            <button
                                key={index}
                                type="button"
                                className="btn btn-sm"
                                onClick={() => this.openIssue(previousIssueButton.monthsAgo)}
                            >
                                <span role="img" aria-label={previousIssueButton.ariaLabel}>
                                    {previousIssueButton.title}
                                </span>
                            </button>
                        ))
                    )}
                </BtnGroup>
            </div>
        );
    }
}

export default PreviousIssuesButtons;
