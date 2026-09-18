import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import CONST from '../../CONST';
import pullRequestPropTypes from '../../lib/pullRequestPropTypes';
import Title from '../../component/panel-title/Title';
import ListItemPull from '../../component/list-item/ListItemPull';
import * as PullRequests from '../../lib/actions/PullRequests';
import * as Preferences from '../../lib/actions/Preferences';
import openAllUrls from '../../lib/openAllUrls';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** Initial delay before first fetch (ms) to stagger API calls */
    initialDelay: PropTypes.number,

    /** All the PRs assigned to the current user */
    prs: PropTypes.objectOf(pullRequestPropTypes),

    /** The preferences of the current user */
    preferences: PropTypes.shape({
        /** Whether the repo tag also shows the number of the PR */
        shouldShowPRNumbers: PropTypes.bool,

        /** Whether PRs are grouped under the issues they address */
        shouldGroupPRsByIssue: PropTypes.bool,
    }),
};
const defaultProps = {
    prs: null,
    initialDelay: 0,
    preferences: {},
};

class ListPRsAssigned extends React.Component {
    constructor(props) {
        super(props);

        this.fetch = this.fetch.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    componentDidMount() {
        this.initialTimeout = setTimeout(() => {
            this.fetch();

            if (this.props.pollInterval && !this.interval) {
                this.interval = setInterval(
                    this.fetch,
                    this.props.pollInterval,
                );
            }
        }, this.props.initialDelay);

        document.addEventListener(
            'visibilitychange',
            this.handleVisibilityChange,
        );
    }

    componentWillUnmount() {
        document.removeEventListener(
            'visibilitychange',
            this.handleVisibilityChange,
        );
        if (this.initialTimeout) {
            clearTimeout(this.initialTimeout);
        }
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        } else {
            this.fetch();
            if (this.props.pollInterval && !this.interval) {
                this.interval = setInterval(
                    this.fetch,
                    this.props.pollInterval,
                );
            }
        }
    }

    /**
     * Order groups by their most recently updated PR, with unlinked PRs last.
     * PRs addressing multiple issues appear in each issue's group.
     *
     * @returns {Object[]}
     */
    getGroups() {
        const prs = _.sortBy(this.props.prs, 'updatedAt').reverse();
        const unlinkedGroup = {issue: null, prs: []};
        if (!this.props.preferences.shouldGroupPRsByIssue) {
            return [{issue: null, prs}];
        }

        const groups = {};
        _.each(prs, (pr) => {
            if (!_.size(pr.linkedIssues)) {
                unlinkedGroup.prs.push(pr);
                return;
            }

            _.each(pr.linkedIssues, (issue) => {
                const key = issue.url.toLowerCase();
                if (!groups[key]) {
                    groups[key] = {issue, prs: []};
                }
                groups[key].prs.push(pr);
            });
        });

        return [..._.values(groups), ...(unlinkedGroup.prs.length ? [unlinkedGroup] : [])];
    }

    fetch() {
        PullRequests.getAssigned();
    }

    render() {
        if (this.props.prs && !_.size(this.props.prs)) {
            return null;
        }

        // Defaults to true so the numbers show until the user turns them off.
        const shouldShowPRNumbers = this.props.preferences.shouldShowPRNumbers !== false;
        const shouldGroupPRsByIssue = !!this.props.preferences.shouldGroupPRsByIssue;

        return (
            <div className="panel your-pull-requests mb-3">
                <Title
                    text="Your Pull Requests"
                    count={_.size(this.props.prs) || 0}
                    onOpenAll={() => openAllUrls(this.props.prs)}
                    items={this.props.prs ? _.values(this.props.prs) : null}
                    checkboxes={[{
                        id: 'shouldShowPRNumbers',
                        label: 'Show PR numbers',
                        isChecked: shouldShowPRNumbers,
                        onChange: () => Preferences.setShouldShowPRNumbers(!shouldShowPRNumbers),
                    }, {
                        id: 'shouldGroupPRsByIssue',
                        label: 'Group by issue',
                        isChecked: shouldGroupPRsByIssue,
                        onChange: () => Preferences.setShouldGroupPRsByIssue(!shouldGroupPRsByIssue),
                    }]}
                />

                {!this.props.prs && (
                    <div className="blankslate capped clean-background">
                        Loading
                    </div>
                )}

                {_.map(this.getGroups(), group => (
                    <div key={group.issue ? group.issue.url : 'unlinked'} className={shouldGroupPRsByIssue ? 'pr-issue-group' : undefined}>
                        {shouldGroupPRsByIssue && (
                            <h4 className="pr-issue-group-title">
                                {group.issue ? (
                                    <a href={group.issue.url} target="_blank" rel="noreferrer noopener">
                                        {group.issue.title}
                                    </a>
                                ) : (
                                    <span>No linked issue</span>
                                )}
                                <span className="Counter pr-issue-group-count">
                                    {`${group.prs.length} ${group.prs.length === 1 ? 'PR' : 'PRs'}`}
                                </span>
                            </h4>
                        )}
                        {_.map(group.prs, pr => (
                            <ListItemPull
                                key={pr.id}
                                pr={pr}
                                shouldShowNumber={shouldShowPRNumbers}
                                dispatchAction={CONST.AGENT_DISPATCHER.ACTIONS.BABYSIT}
                                showStallNudge
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    }
}

ListPRsAssigned.propTypes = propTypes;
ListPRsAssigned.defaultProps = defaultProps;

export default withOnyx({
    prs: {
        key: ONYXKEYS.PRS.ASSIGNED,
    },
    preferences: {
        key: ONYXKEYS.PREFERENCES,
    },
})(ListPRsAssigned);
