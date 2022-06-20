import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';

const propTypes = {
    /** Data about the pull request being displayed */
    data: PropTypes.shape({
        /** The date that the PR was updated */
        updatedAt: PropTypes.string.isRequired,

        /** The title of the PR */
        title: PropTypes.string.isRequired,

        /** The URL to the PR */
        url: PropTypes.string.isRequired,

        /** Whether or not the PR is a draft */
        isDraft: PropTypes.bool.isRequired,

        /** The current state of the PR merge */
        mergable: PropTypes.oneOf(['MERGEABLE', 'CONFLICTING', 'UNKNOWN']).isRequired,

        /** The user login of the person assigned to the PR */
        login: PropTypes.string,

        /** The status of PR reviews */
        reviewDecision: PropTypes.oneOf(['CHANGES_REQUESTED', 'APPROVED', 'REVIEW_REQUIRED']).isRequired,

        /** Info about comments on the PR */
        comments: PropTypes.shape({
            /** The number of comments on the PR */
            totalCount: PropTypes.number,
        }),

        /** Whether or not the user is done reviewing */
        userIsFinishedReviewing: PropTypes.bool,

        /** Information about the PR from GitHub */
        pr: PropTypes.shape({
            /** Travis Status of the PR */
            status: PropTypes.arrayOf(PropTypes.shape({
                /** Current state of the travis tests */
                state: PropTypes.string.isRequired,
            })).isRequired,
        }),

        /** Information about review on the PR */
        reviews: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
};

const ListItemPull = (props) => {
    function getClassName() {
        let className = 'issue';
        const today = moment();
        const days = 7;

        // See if it's overdue
        const isOverdue = moment(props.data.updatedAt).isBefore(today.subtract(days, 'days'), 'day');

        if (isOverdue) {
            className += ' overdue';
        }

        if (props.data.title.indexOf('[HOLD') > -1
            || props.data.title.indexOf('[WIP') > -1) {
            className += ' hold';
        }

        return className;
    }

    let mergeability = '';

    switch (props.data.mergable) {
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

    switch (props.data.reviewDecision) {
        case 'CHANGES_REQUESTED':
            mergeability = 'Changes Requested';
            break;
        case 'REVIEW_REQUIRED':
            mergeability = 'Needs Review';
            break;
        default:
            break;
    }

    if (props.data.isDraft) {
        mergeability = 'Draft';
    }

    return (
        <div className="panel-item">

            <span className="panel-item-meta">
                <span className="age">
                    Updated:
                    {' '}
                    {moment(props.data.updatedAt).fromNow()}
                </span>

                <span className="comments">
                    Comments:
                    {' '}
                    {props.data.comments.totalCount}
                </span>

                <span className="comments">
                    Reviews:
                    {' '}
                    {props.data.reviews.length}
                </span>

                {/* @TODO get the status for Travis and put it here */}
                {false && props.data.pr.status && props.data.pr.status.length && props.data.pr.status[0].state
                    ? (
                        <span className={`travis-status ${props.data.pr.status[0].state}`}>
                            Travis:
                            {' '}
                            {props.data.pr.status[0].state}
                            ,
                        </span>
                    )
                    : null}

                {mergeability && (
                    <span className={`mergeable-state ${props.data.mergable} ${mergeability === 'Draft' && 'DRAFT'}`}>
                        {mergeability}
                    </span>
                )}
            </span>

            <a href={props.data.url} className={getClassName()} target="_blank" rel="noreferrer noopener">
                <span className="octicon octicon-alert" />
                {props.data.title}
                {' '}
            </a>

            {props.data.userIsFinishedReviewing ? (
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

export default ListItemPull;
