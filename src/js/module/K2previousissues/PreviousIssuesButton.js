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
            errorMessage: '',
            showError: false,
        };
    }

    showErrorMessage(message) {
        this.setState({
            errorMessage: message,
            showError: true,
        });

        setTimeout(() => {
            this.setState({
                showError: false,
            });

            setTimeout(() => {
                this.setState({
                    errorMessage: '',
                });
            }, 300);
        }, 5000);
    }

    openIssue(buttonConfig) {
        API.getCurrentIssueDescription()
            .then((issueTitleResponse) => {
                const ghTitle = issueTitleResponse.data.title;

                // Single regex to catch both Monthly and Quarterly formats
                // The (\w+) between "Accounting" and "Close" captures either "Monthly" or "Quarterly"
                const searchParts = ghTitle.match(/\[.*\] (Accounting (\w+) Close) ((?:\w{3} \d{4})|(?:Q\d \d{4})) (.*) \[.*\]/);

                if (!searchParts) {
                    console.debug('Found no search parts in issue title:', ghTitle);
                    this.showErrorMessage('Unable to parse issue title format');
                    return;
                }

                const closeType = searchParts[2]; // "Monthly" or "Quarterly"
                const isQuarterly = closeType === 'Quarterly';
                const periodText = searchParts[3]; // "MMM YYYY" or "QN YYYY"
                const taskText = searchParts[4]; // The task description

                const filteredSearchParts = [searchParts[1], taskText];
                let previousPeriodFormatted = '';

                if (isQuarterly) {
                    // Handle quarterly format
                    const quarterParts = periodText.match(/Q(\d) (\d{4})/);
                    if (!quarterParts) {
                        console.debug('Invalid quarter format:', periodText);
                        this.showErrorMessage('Invalid quarter format in issue title');
                        return;
                    }

                    const currentQuarter = parseInt(quarterParts[1], 10);
                    const currentYear = parseInt(quarterParts[2], 10);

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
                        this.showErrorMessage('Cannot use monthly navigation on a quarterly issue');
                        return;
                    }
                } else {
                    // Handle monthly format
                    const currentMonth = moment(periodText, 'MMM YYYY').toDate();

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
                        this.showErrorMessage('Cannot use quarterly navigation on a monthly issue');
                        return;
                    }
                }

                console.debug('Looking for previous period:', previousPeriodFormatted);

                return API.getPreviousInstancesOfIssue(filteredSearchParts)
                    .then((previousIssuesResponse) => {
                        if (!previousIssuesResponse || _.isEmpty(previousIssuesResponse)) {
                            console.debug('No previous issues found');
                            this.showErrorMessage(`No previous issues found for ${previousPeriodFormatted}`);
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
                        } else {
                            this.showErrorMessage(`No previous issue found for ${previousPeriodFormatted}`);
                        }
                    });
            })
            .catch((error) => {
                console.error('Error fetching previous issues:', error);
                this.showErrorMessage('Error fetching previous issues');
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
                        <>
                            {_.map(previousIssueButtons, (previousIssueButton, index) => (
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
                            ))}
                            {this.state.showError && (
                                <div style={{
                                    color: 'red',
                                    fontSize: '12px',
                                    marginTop: '5px',
                                    opacity: this.state.showError ? 1 : 0,
                                    transition: 'opacity 0.3s ease-in-out',
                                }}
                                >
                                    {this.state.errorMessage}
                                </div>
                            )}
                        </>
                    )}
                </BtnGroup>
            </div>
        );
    }
}

export default PreviousIssuesButtons;
