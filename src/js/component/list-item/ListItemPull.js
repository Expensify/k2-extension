import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import pullRequestPropTypes from '../../lib/pullRequestPropTypes';
import * as PullRequests from '../../lib/actions/PullRequests';

const propTypes = {
    /** Data about the pull request being displayed. The `data` and `pr` props are the same and can come from multiple
     * sources. The new refactored code users `pr` because it's more semantically correct, but old data uses `data`.
     * Once all the refactoring is done to move all this data to Onyx, then `data` can be removed. */
    data: pullRequestPropTypes,

    /** Data about the pull request being displayed */
    pr: pullRequestPropTypes,

    /** Snooze state for this PR (if snoozed) */
    snoozeState: PropTypes.shape({
        updatedAt: PropTypes.string,
        commentsCount: PropTypes.number,
        reviewsCount: PropTypes.number,
    }),
};
const defaultProps = {
    data: null,
    pr: null,
    snoozeState: null,
};

function ListItemPull(props) {
    const pr = props.pr || props.data;
    const repoPrefix = pr.repository ? `[${pr.repository.name}]` : '';

    if (!pr.id) {
        return null;
    }

    // Check if this PR is snoozed and has no new activity
    const {snoozeState} = props;
    const hasSnoozeState = snoozeState
        && snoozeState.updatedAt !== undefined
        && snoozeState.commentsCount !== undefined
        && snoozeState.reviewsCount !== undefined;

    // A PR has new activity if any of these values differ from when it was snoozed
    const hasNewActivity = hasSnoozeState && (
        pr.updatedAt !== snoozeState.updatedAt
        || pr.comments.totalCount !== snoozeState.commentsCount
        || pr.reviews.totalCount !== snoozeState.reviewsCount
    );

    // PR is visually snoozed only if it has snooze state AND no new activity
    const isSnoozed = hasSnoozeState && !hasNewActivity;

    function handleSnoozeClick(e) {
        e.preventDefault();
        e.stopPropagation();

        if (isSnoozed) {
            // Unsnooze the PR
            PullRequests.unsnoozePR(pr.id);
        } else {
            // Snooze the PR with current state
            PullRequests.snoozePR(
                pr.id,
                pr.updatedAt,
                pr.comments.totalCount,
                pr.reviews.totalCount,
            );
        }
    }

    function getClassName() {
        let className = 'issue';
        const today = moment();
        const days = 7;

        // See if it's overdue
        const isOverdue = moment(pr.updatedAt).isBefore(today.subtract(days, 'days'), 'day');

        if (isOverdue) {
            className += ' overdue';
        }

        if (pr.title.indexOf('[HOLD') > -1
            || pr.title.indexOf('[WIP') > -1) {
            className += ' hold';
        }

        return className;
    }

    let mergeability = 'Done reviewing';

    switch (pr.mergeable) {
        case 'MERGEABLE':
            mergeability = 'Approved';
            break;
        case 'CONFLICTING':
            mergeability = 'Merge Conflicts';
            break;
        case 'UNKNOWN':
            mergeability = 'Mergeability Unknown';
            break;
        default:
            break;
    }

    switch (pr.reviewDecision) {
        case 'CHANGES_REQUESTED':
            mergeability = 'Changes Requested';
            break;
        case 'REVIEW_REQUIRED':
            mergeability = 'Needs Review';
            break;
        default:
            break;
    }

    if (pr.isDraft) {
        mergeability = 'Draft';
    }

    return (
        <div className={`panel-item${isSnoozed ? ' snoozed' : ''}`}>
            <span className="panel-item-meta">
                <span className="age">
                    Updated:
                    {' '}
                    {moment(pr.updatedAt).fromNow()}
                </span>

                <span className="comments">
                    Comments:
                    {' '}
                    {pr.comments.totalCount}
                </span>

                <span className="comments">
                    Reviews:
                    {' '}
                    {pr.reviews.totalCount}
                </span>

                {pr.checkConclusion && (
                    <span className={`travis-status ${pr.checkConclusion}`}>
                        Travis:
                        {' '}
                        {pr.checkConclusion}
                        ,
                    </span>
                )}

                {mergeability && (
                    <span className={`mergeable-state ${pr.reviewDecision} ${pr.mergeable} ${(mergeability === 'Draft' && 'DRAFT') || ''}`}>
                        {mergeability}
                    </span>
                )}

                <button
                    type="button"
                    className={`snooze-button${isSnoozed ? ' active' : ''}`}
                    onClick={handleSnoozeClick}
                    title={isSnoozed ? 'Unsnooze this PR' : 'Snooze until new activity'}
                    aria-label={isSnoozed ? 'Unsnooze this PR' : 'Snooze until new activity'}
                >
                    😴
                </button>
            </span>

            <a href={pr.url} className={getClassName()} target="_blank" rel="noreferrer noopener">
                <span className="octicon octicon-alert" />
                {`${repoPrefix} ${pr.title}`}
                {' '}
            </a>

            {mergeability === 'Draft' && <span className="Counter">draft</span>}
        </div>
    );
}

ListItemPull.propTypes = propTypes;
ListItemPull.defaultProps = defaultProps;
ListItemPull.displayName = 'ListItemPull';

export default ListItemPull;
