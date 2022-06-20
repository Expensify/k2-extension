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

const ListItemPull = (props) => {
    const pr = props.pr || props.data;

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

    let mergeability = '';

    switch (pr.mergable) {
        case 'MERGEABLE':
            mergeability = 'Approved';
            break;
        case 'CONFLICTING':
            mergeability = 'Merge Conflicts';
            break;
        case 'UNKNOWN':
        default:
            mergeability = 'Mergeability Unknown';
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
                    {pr.reviews.length}
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
                    <span className={`mergeable-state ${pr.mergable} ${mergeability === 'Draft' && 'DRAFT'}`}>
                        {mergeability}
                    </span>
                )}
            </span>

            <a href={pr.url} className={getClassName()} target="_blank" rel="noreferrer noopener">
                <span className="octicon octicon-alert" />
                {pr.title}
                {' '}
            </a>

            {pr.userIsFinishedReviewing ? (
                <span>
                    <span className="Counter">done reviewing</span>
                    {' '}
                </span>
            ) : null}

            {mergeability === 'Draft' && <span className="Counter">draft</span>}
        </div>
    );
};

ListItemPull.propTypes = propTypes;
ListItemPull.defaultProps = defaultProps;
ListItemPull.displayName = 'ListItemPull';

export default ListItemPull;
