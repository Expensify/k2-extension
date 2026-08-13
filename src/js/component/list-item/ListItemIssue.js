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
    const isOverdue = hasLabel(issue, 'Overdue');
    const isHeld = issue.title.toLowerCase().includes('[hold');
    const isChallengeSent = hasLabel(issue, 'Take Home Challenge Sent');
    const isHelpWanted = hasLabel(issue, 'Help Wanted');
    const isMuted = isHeld || isChallengeSent || isHelpWanted || (issue.issueHasOwner && !issue.currentUserIsOwner);
    let ownerIcon = null;
    if (issue.currentUserIsOwner) {
        ownerIcon = <StarFillIcon />;
    } else if (issue.issueHasOwner) {
        ownerIcon = <StarIcon />;
    }
    const issueTypeLabels = _.filter([
        ['External', 'E', 'secondary', 'External'],
        ['Improvement', 'I', 'done', 'Improvement'],
        ['Task', 'T', 'attention', 'Task'],
        ['NewFeature', 'F', 'sponsors', 'New Feature'],
    ], ([label]) => hasLabel(issue, label));

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
                    {!!issueTypeLabels.length && (
                        <LabelGroup className="k2-work-item-labels" aria-label="Issue type">
                            {_.map(issueTypeLabels, ([label, shortName, variant, title]) => (
                                <Label key={label} variant={variant} size="small" title={title}>{shortName}</Label>
                            ))}
                        </LabelGroup>
                    )}
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
