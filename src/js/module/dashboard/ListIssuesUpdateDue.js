import React from 'react';
import _ from 'underscore';
import moment from 'moment';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import CONST from '../../CONST';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import ListItemIssue from '../../component/list-item/ListItemIssue';
import Title from '../../component/panel-title/Title';
import * as Issues from '../../lib/actions/Issues';
import * as API from '../../lib/api';
import openAllUrls from '../../lib/openAllUrls';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** Initial delay before first fetch (ms) to stagger API calls */
    initialDelay: PropTypes.number,

    /** All issues assigned to the current user */
    issues: PropTypes.objectOf(IssuePropTypes),
};
const defaultProps = {
    issues: null,
    initialDelay: 0,
};

function getIssuesWithUpdateDue(issues, currentUser) {
    return _.chain(issues)
        .map((issue) => {
            const cadenceLabel = _.find(
                _.keys(CONST.UPDATE_CADENCE_DAYS),
                label => _.findWhere(issue.labels, {name: label}),
            );
            if (!cadenceLabel) {
                return null;
            }
            if (issue.title.toLowerCase().indexOf('[hold') > -1) {
                return null;
            }
            if (issue.issueHasOwner && !issue.currentUserIsOwner) {
                return null;
            }

            const ownComments = _.filter(
                (issue.comments && issue.comments.nodes) || [],
                comment => comment.author.login === currentUser,
            );
            const lastUpdateAt = ownComments.length
                ? _.last(ownComments).createdAt
                : issue.createdAt;
            const daysSinceUpdate = moment().diff(lastUpdateAt, 'days');
            const daysOverdue = daysSinceUpdate - CONST.UPDATE_CADENCE_DAYS[cadenceLabel];
            if (daysOverdue < 0) {
                return null;
            }

            return {...issue, cadenceLabel, daysOverdue};
        })
        .compact()
        .sortBy('daysOverdue')
        .value()
        .reverse();
}

class ListIssuesUpdateDue extends React.Component {
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

    fetch() {
        Issues.getAllAssigned();
    }

    render() {
        const issuesWithUpdateDue = this.props.issues
            ? getIssuesWithUpdateDue(this.props.issues, API.getCurrentUser())
            : null;

        if (issuesWithUpdateDue && !issuesWithUpdateDue.length) {
            return null;
        }

        return (
            <div className="panel update-due mb-3">
                <Title
                    text="Updates Due"
                    count={(issuesWithUpdateDue || []).length}
                    onOpenAll={() => openAllUrls(issuesWithUpdateDue)}
                    items={issuesWithUpdateDue}
                />

                {!issuesWithUpdateDue && (
                    <div className="blankslate capped clean-background">
                        Loading
                    </div>
                )}

                {_.map(issuesWithUpdateDue, issue => (
                    <ListItemIssue
                        key={issue.id}
                        issue={issue}
                        dispatchAction={CONST.AGENT_DISPATCHER.ACTIONS.UPDATE}
                        meta={(
                            <span className="k2-update-due-badge">
                                {issue.daysOverdue === 0
                                    ? `${issue.cadenceLabel} · due today`
                                    : `${issue.cadenceLabel} · ${issue.daysOverdue}d overdue`}
                            </span>
                        )}
                    />
                ))}
            </div>
        );
    }
}

ListIssuesUpdateDue.propTypes = propTypes;
ListIssuesUpdateDue.defaultProps = defaultProps;

export default withOnyx({
    issues: {
        key: ONYXKEYS.ISSUES.ASSIGNED,
    },
})(ListIssuesUpdateDue);
