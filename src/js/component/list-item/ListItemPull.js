import React from 'react';
import moment from 'moment';
import {
    CounterLabel, Label, LabelGroup, Link, RelativeTime, Stack,
} from '@primer/react';
import {GitPullRequestIcon} from '@primer/octicons-react';
import pullRequestPropTypes from '../../lib/pullRequestPropTypes';

const propTypes = {
    data: pullRequestPropTypes,
    pr: pullRequestPropTypes,
};

const defaultProps = {
    data: null,
    pr: null,
};

function getMergeability(pr) {
    if (pr.isDraft) {
        return {label: 'Draft', variant: 'secondary'};
    }
    if (pr.reviewDecision === 'CHANGES_REQUESTED') {
        return {label: 'Changes requested', variant: 'danger'};
    }
    if (pr.reviewDecision === 'REVIEW_REQUIRED') {
        return {label: 'Needs review', variant: 'attention'};
    }
    if (pr.mergeable === 'MERGEABLE') {
        return {label: 'Approved', variant: 'success'};
    }
    if (pr.mergeable === 'CONFLICTING') {
        return {label: 'Merge conflicts', variant: 'danger'};
    }
    if (pr.mergeable === 'UNKNOWN') {
        return {label: 'Mergeability unknown', variant: 'secondary'};
    }
    return {label: 'Done reviewing', variant: 'done'};
}

function getCheckVariant(checkConclusion) {
    if (checkConclusion === 'success') {
        return 'success';
    }
    if (checkConclusion === 'failure') {
        return 'danger';
    }
    return 'secondary';
}

function ListItemPull(props) {
    const pr = props.pr || props.data;
    if (!pr.id) {
        return null;
    }

    const repository = pr.repository ? `[${pr.repository.name}] ` : '';
    const isOverdue = moment(pr.updatedAt).isBefore(moment().subtract(7, 'days'), 'day');
    const isHeld = pr.title.includes('[HOLD') || pr.title.includes('[WIP');
    const mergeability = getMergeability(pr);

    return (
        <div className={`k2-work-item${pr.isReviewRequested === false ? ' k2-work-item-reviewed' : ''}`}>
            <Stack direction="horizontal" gap="condensed" align="start">
                <GitPullRequestIcon className="k2-work-item-icon" />
                <Stack.Item grow>
                    <Link
                        href={pr.url}
                        className={`k2-work-item-title${isHeld ? ' k2-work-item-muted' : ''}${isOverdue ? ' k2-work-item-overdue' : ''}`}
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        {`${repository}${pr.title}`}
                    </Link>
                    <Stack className="k2-work-item-meta" direction="horizontal" gap="condensed" align="center" wrap="wrap">
                        <span>
                            Updated
                            {' '}
                            <RelativeTime date={new Date(pr.updatedAt)} />
                        </span>
                        <span>
                            Comments
                            {' '}
                            <CounterLabel>{pr.comments.totalCount}</CounterLabel>
                        </span>
                        <span>
                            Reviews
                            {' '}
                            <CounterLabel>{pr.reviews.totalCount}</CounterLabel>
                        </span>
                    </Stack>
                    <LabelGroup className="k2-work-item-labels" aria-label="Pull request status">
                        {isOverdue && <Label variant="danger" size="small">Overdue</Label>}
                        {pr.checkConclusion && (
                            <Label variant={getCheckVariant(pr.checkConclusion)} size="small">
                                {`Checks: ${pr.checkConclusion}`}
                            </Label>
                        )}
                        <Label variant={mergeability.variant} size="small">{mergeability.label}</Label>
                    </LabelGroup>
                </Stack.Item>
            </Stack>
        </div>
    );
}

ListItemPull.propTypes = propTypes;
ListItemPull.defaultProps = defaultProps;
ListItemPull.displayName = 'ListItemPull';

export default ListItemPull;
