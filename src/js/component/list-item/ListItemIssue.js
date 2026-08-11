import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {
    Avatar, AvatarStack, Label, LabelGroup, Link, Stack,
} from '@primer/react';
import {StarFillIcon, StarIcon} from '@primer/octicons-react';
import IssuePropTypes from './IssuePropTypes';

const propTypes = {
    issue: IssuePropTypes.isRequired,
    showAttendees: PropTypes.bool,
};

const defaultProps = {
    showAttendees: false,
};

function hasLabel(issue, labelName) {
    return _.some(issue.labels, label => label.name.toLowerCase() === labelName.toLowerCase());
}

function ListItemIssue({issue, showAttendees}) {
    const isExternal = hasLabel(issue, 'External');
    const isUnderReview = hasLabel(issue, 'Reviewing');
    const isOverdue = hasLabel(issue, 'Overdue');
    const isPlanning = hasLabel(issue, 'Planning');
    const isWaitingForCustomer = hasLabel(issue, 'Waiting for customer');
    const isHeld = issue.title.toLowerCase().includes('[hold');
    const isChallengeSent = hasLabel(issue, 'Take Home Challenge Sent');
    const isHelpWanted = hasLabel(issue, 'Help Wanted');
    const isContributorAssigned = isExternal && !isHelpWanted;
    const isMuted = isHeld || isChallengeSent || isHelpWanted || (issue.issueHasOwner && !issue.currentUserIsOwner);
    let ownerIcon = null;
    if (issue.currentUserIsOwner) {
        ownerIcon = <StarFillIcon />;
    } else if (issue.issueHasOwner) {
        ownerIcon = <StarIcon />;
    }
    const priorityLabels = ['Hourly', 'Daily', 'Weekly', 'Monthly'];
    const shortLabels = [
        ['WhatsNext', 'WN', 'accent'],
        ['FirstPick', 'FP', 'accent'],
        ['External', 'E', 'secondary'],
        ['Improvement', 'I', 'done'],
        ['Task', 'T', 'attention'],
        ['NewFeature', 'F', 'sponsors'],
    ];

    return (
        <div className="k2-work-item">
            <Stack direction="horizontal" gap="condensed" align="start">
                <span
                    className={issue.currentUserIsOwner ? 'k2-owner-icon k2-owner-icon-current' : 'k2-owner-icon'}
                    title={issue.currentUserIsOwner ? 'You own this issue' : 'Owned by someone else'}
                    aria-label={issue.currentUserIsOwner ? 'You own this issue' : 'Owned by someone else'}
                >
                    {ownerIcon}
                </span>
                <Stack.Item grow>
                    <Link
                        href={issue.url}
                        className={`k2-work-item-title${isMuted ? ' k2-work-item-muted' : ''}${isOverdue ? ' k2-work-item-overdue' : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {issue.title}
                    </Link>
                    <LabelGroup className="k2-work-item-labels" aria-label="Issue metadata">
                        {_.map(priorityLabels, label => hasLabel(issue, label) && (
                            <Label key={label} className="k2-priority-label" variant={label === 'Hourly' ? 'danger' : 'accent'} size="small">
                                {label}
                            </Label>
                        ))}
                        {_.map(shortLabels, ([label, shortName, variant]) => hasLabel(issue, label) && (
                            <Label key={label} variant={variant} size="small" title={label}>{shortName}</Label>
                        ))}
                        {isUnderReview && <Label variant="secondary" size="small">Under review</Label>}
                        {isOverdue && <Label variant="danger" size="small">Overdue</Label>}
                        {isPlanning && <Label variant="attention" size="small">Planning</Label>}
                        {isWaitingForCustomer && <Label variant="attention" size="small">Waiting</Label>}
                        {isContributorAssigned && <Label variant="accent" size="small">Contributor assigned</Label>}
                    </LabelGroup>
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
