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
        type: 'monthly',
    },
    {
        title: 'Previous Version (-3M)',
        ariaLabel: 'three months ago',
        monthsAgo: 3,
        type: 'monthly',
    },
    {
        title: 'Previous Version (-1Q)',
        ariaLabel: 'one quarter ago',
        quartersAgo: 1,
        type: 'quarterly',
    },
    {
        title: 'Previous Version (-1Y)',
        ariaLabel: 'one year ago',
        yearsAgo: 1,
        type: 'all',
    },
];

class PreviousIssuesButtons extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
        };
    }

    openIssue(buttonConfig) {
        API.getCurrentIssueDescription()
            .then((issueTitleResponse) => {
                const ghTitle = issueTitleResponse.data.title;

                // Check for Monthly Close format
                const monthlySearchParts = ghTitle.match(/\[.*\] (Accounting \w+ Close) (\w{3} \d{4}) (.*) \[.*\]/);

                // Check for Quarterly Close format
                const quarterlySearchParts = ghTitle.match(/\[.*\] (Accounting Quarterly Close) (Q\d) (\d{4}) (.*) \[.*\]/);

                const filteredSearchParts = [];
                let previousPeriodFormatted = '';

                if (monthlySearchParts) {
                    // Handle monthly format
                    filteredSearchParts.push(monthlySearchParts[1]);
                    filteredSearchParts.push(monthlySearchParts[3]);

                    const currentMonth = moment(monthlySearchParts[2], 'MMM YYYY').toDate();

                    if (buttonConfig.type === 'monthly' || buttonConfig.type === 'all') {
                        const previousMonth = new Date(currentMonth);
                        if (buttonConfig.monthsAgo) {
                            previousMonth.setMonth(previousMonth.getMonth() - buttonConfig.monthsAgo);
                        } else if (buttonConfig.yearsAgo) {
                            previousMonth.setFullYear(previousMonth.getFullYear() - buttonConfig.yearsAgo);
                        }
                        previousPeriodFormatted = moment(previousMonth).format('MMM YYYY');
                    } else {
                        console.debug('Cannot go back by quarters for a monthly issue');
                        return;
                    }
                } else if (quarterlySearchParts) {
                    // Handle quarterly format
                    filteredSearchParts.push(quarterlySearchParts[1]);
                    filteredSearchParts.push(quarterlySearchParts[4]);

                    const currentQuarter = parseInt(quarterlySearchParts[2].substring(1), 10);
                    const currentYear = parseInt(quarterlySearchParts[3], 10);

                    if (buttonConfig.type === 'quarterly' || buttonConfig.type === 'all') {
                        let targetQuarter = currentQuarter;
                        let targetYear = currentYear;

                        if (buttonConfig.quartersAgo) {
                            targetQuarter -= buttonConfig.quartersAgo;

                            // Handle quarter wrapping
                            while (targetQuarter <= 0) {
                                targetYear--;
                                targetQuarter += 4;
                            }
                        } else if (buttonConfig.yearsAgo) {
                            targetYear -= buttonConfig.yearsAgo;
                        }

                        previousPeriodFormatted = `Q${targetQuarter} ${targetYear}`;
                    } else {
                        console.debug('Cannot go back by months for a quarterly issue');
                        return;
                    }
                } else {
                    console.debug('Found no search parts in issue title:', ghTitle);
                    return;
                }

                console.debug('Looking for previous period:', previousPeriodFormatted);

                return API.getPreviousInstancesOfIssue(filteredSearchParts)
                    .then((previousIssuesResponse) => {
                        if (!previousIssuesResponse || _.isEmpty(previousIssuesResponse)) {
                            console.debug('No previous issues found');
                            return;
                        }

                        // Convert object response to array of issues
                        const issues = _.values(previousIssuesResponse);

                        const matchingIssue = _.find(issues, issue => _.has(issue, 'milestone')
                            && _.has(issue.milestone, 'title')
                            && issue.milestone.title.includes(previousPeriodFormatted));

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
                                onClick={() => this.openIssue(previousIssueButton)}
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
