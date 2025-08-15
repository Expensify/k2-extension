import React from 'react';
import moment from 'moment';
import pullRequestPropTypes from '../../lib/pullRequestPropTypes';

const propTypes = {
    /** Data about the pull request being displayed. The `data` and `pr` props are the same and can come from multiple
     * sources. The new refactored code users `pr` because it's more semantically correct, but old data uses `data`.
     * Once all the refactoring is done to move all this data to Onyx, then `data` can be removed. */
    data: pullRequestPropTypes,

    /** Data about the pull request being displayed */
    pr: pullRequestPropTypes,
};
const defaultProps = {
    data: null,
    pr: null,
};

function ListItemPull(props) {
    const pr = props.pr || props.data;
    const repoPrefix = pr.repository ? `${pr.repository.name}` : '';

    if (!pr.id) {
        return null;
    }
    function getClassName(mergeability) {
        let className = 'issue';
        const today = moment();
        const days = 7;

        // See if it's overdue
        const isOverdue = moment(pr.updatedAt).isBefore(today.subtract(days, 'days'), 'day');

        if (isOverdue) {
            className += ' overdue';
        }

        if (mergeability === 'Approved') {
            className += ' approved';
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

    return (
        <div className="panel-item">
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

                <span className="repository">
                    Repo:
                    {' '}
                    {`${repoPrefix}`}
                </span>
            </span>

            <a href={pr.url} className={getClassName(mergeability)} target="_blank" rel="noreferrer noopener">
                <span className="octicon octicon-alert" />
                {`${pr.title}`}
                {' '}
            </a>

            {pr.isDraft && <span className="Counter">draft</span>}
        </div>
    );
}

ListItemPull.propTypes = propTypes;
ListItemPull.defaultProps = defaultProps;
ListItemPull.displayName = 'ListItemPull';

export default ListItemPull;
