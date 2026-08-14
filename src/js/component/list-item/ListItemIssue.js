import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {
    Avatar, AvatarStack, Label, Link, Stack,
} from '@primer/react';
import {StarFillIcon, StarIcon} from '@primer/octicons-react';
import IssuePropTypes from './IssuePropTypes';

const propTypes = {
    issue: IssuePropTypes.isRequired,
    showAttendees: PropTypes.bool,
    showPriority: PropTypes.bool,
};

const defaultProps = {
    showAttendees: false,
    showPriority: false,
};

function hasLabel(issue, labelName) {
    return _.some(issue.labels, label => label.name.toLowerCase() === labelName.toLowerCase());
}

function ListItemIssue({issue, showAttendees, showPriority}) {
    const isOverdue = hasLabel(issue, 'Overdue');
    const isHeld = issue.title.toLowerCase().includes('[hold');
    const isChallengeSent = hasLabel(issue, 'Take Home Challenge Sent');
    const isHelpWanted = hasLabel(issue, 'Help Wanted');
    const isMuted = isHeld || isChallengeSent || isHelpWanted || (issue.issueHasOwner && !issue.currentUserIsOwner);
    let ownerIcon = null;
    let ownerDescription = '';
    if (issue.currentUserIsOwner) {
        ownerIcon = <StarFillIcon />;
        ownerDescription = 'You own this issue';
    } else if (issue.issueHasOwner) {
        ownerIcon = <StarIcon />;
        ownerDescription = 'Owned by someone else';
    }
    const issueTypeLabels = _.filter([
        ['External', 'E', 'secondary', 'External'],
        ['Improvement', 'I', 'done', 'Improvement'],
        ['Task', 'T', 'attention', 'Task'],
        ['NewFeature', 'F', 'sponsors', 'New Feature'],
    ], ([label]) => hasLabel(issue, label));
    const priority = _.find([
        ['Hourly', 'danger'],
        ['Daily', 'severe'],
        ['Weekly', 'success'],
        ['Monthly', 'done'],
    ], ([label]) => hasLabel(issue, label)) || ['No priority', 'secondary'];
    const hasLeadingRow = !!ownerIcon || !!issueTypeLabels.length;
    const hasLeadingContent = hasLeadingRow || showPriority;

    return (
        <div className="k2-work-item k2-issue-work-item">
            <Stack direction="horizontal" gap="condensed" align="start">
                {hasLeadingContent && (
                    <Stack className="k2-issue-leading" align="start" gap="tight">
                        {hasLeadingRow && (
                            <Stack direction="horizontal" align="center" gap="tight" aria-label="Issue metadata">
                                {ownerIcon && (
                                    <span
                                        className={issue.currentUserIsOwner ? 'k2-owner-icon k2-owner-icon-current' : 'k2-owner-icon'}
                                        title={ownerDescription}
                                        aria-label={ownerDescription}
                                    >
                                        {ownerIcon}
                                    </span>
                                )}
                                {_.map(issueTypeLabels, ([label, shortName, variant, title]) => (
                                    <Label key={label} variant={variant} size="small" title={title}>{shortName}</Label>
                                ))}
                            </Stack>
                        )}
                        {showPriority && <Label variant={priority[1]} size="small">{priority[0]}</Label>}
                    </Stack>
                )}
                <Stack.Item grow>
                    <Link
                        href={issue.url}
                        className={`k2-work-item-title${isMuted ? ' k2-work-item-muted' : ''}${isOverdue ? ' k2-work-item-overdue' : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {issue.title}
                    </Link>
                </Stack.Item>
                {showAttendees && issue.assignees.length > 0 && (
                    <AvatarStack alignRight size={20} aria-label={`Assigned to ${_.pluck(issue.assignees, 'login').join(', ')}`}>
                        {_.map([...issue.assignees].reverse(), assignee => (
                            <Link
                                href={`/Expensify/App/issues?q=assignee%3A${assignee.login}+is%3Aopen`}
                                key={assignee.login}
                                aria-label={`${assignee.login}'s assigned issues`}
                            >
                                <Avatar src={assignee.avatarUrl} alt={`@${assignee.login}`} size={20} />
                            </Link>
                        ))}
                    </AvatarStack>
                )}
            </Stack>
        </div>
    );
}

ListItemIssue.propTypes = propTypes;
ListItemIssue.defaultProps = defaultProps;
ListItemIssue.displayName = 'ListItemIssue';

export default ListItemIssue;
