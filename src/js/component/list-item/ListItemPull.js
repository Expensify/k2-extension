import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';

const propTypes = {
    /** Data about the pull request being displayed */
    data: PropTypes.shape({
        /** The date that the PR was updated */
        updated_at: PropTypes.string.isRequired,

        /** The title of the PR */
        title: PropTypes.string.isRequired,

        /** The URL to the PR */
        html_url: PropTypes.string.isRequired,

        /** The user login of the person assigned to the PR */
        login: PropTypes.string.isRequired,

        /** The comments on the PR */
        comments: PropTypes.arrayOf(PropTypes.string).isRequired,

        /** Whether or not the user is done reviewing */
        userIsFinishedReviewing: PropTypes.bool.isRequired,

        /** Information about the PR from GitHub */
        pr: PropTypes.shape({
            /** Whether or not the PR is merged */
            merged: PropTypes.bool.isRequired,

            /** The current state of the PR merge */
            mergeable_state: PropTypes.string.isRequired,

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
        const isOverdue = moment(props.data.updated_at).isBefore(today.subtract(days, 'days'), 'day');

        if (isOverdue) {
            className += ' overdue';
        }

        if (props.data.title.indexOf('[HOLD') > -1
            || props.data.title.indexOf('[WIP') > -1) {
            className += ' hold';
        }

        return className;
    }

    if (!props.data.pr || props.data.pr.merged) {
        // This should not be reached unless there is a GitHub API error. Since we
        // have seen some such errors, filter out already-merged PRs or PRs with
        // missing data.
        return null;
    }

    const mergeableState = props.data.pr.mergeable_state || 'unknown';
    let mergeability = '';

    switch (mergeableState) {
        case 'dirty':
            mergeability = 'Merge Conflicts';
            break;
        case 'blocked':
            if (!props.data.reviews || !props.data.reviews.length) {
                mergeability = 'Needs Review';
            } else {
                mergeability = 'Changes Requested';
            }
            break;
        case 'behind':
            mergeability = 'Branch Behind';
            break;
        case 'unstable':
            mergeability = 'Merge With Caution';
            break;
        case 'has_hooks':
        case 'clean':
            mergeability = 'Approved';
            break;
        case 'draft':
            mergeability = 'Draft';
            break;
        case 'unknown':
        default:
            mergeability = 'Mergeability Unknown';
    }

    return (
        <div className="panel-item">

            <span className="panel-item-meta">
                <span className="age">
                    Updated:
                    {moment(props.data.updated_at).fromNow()}
                </span>

                <span className="comments">
                    Comments:
                    {' '}
                    {props.data.comments}
                </span>

                <span className="comments">
                    Reviews:
                    {' '}
                    {props.data.reviews.length}
                </span>

                {props.data.pr.status && props.data.pr.status.length && props.data.pr.status[0].state
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
                    <span className={`mergeable-state ${mergeableState}`}>
                        {mergeability}
                    </span>
                )}
            </span>

            <a href={props.data.html_url} className={getClassName()} target="_blank" rel="noreferrer noopener">
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

            {mergeableState === 'draft' ? (
                <span className="Counter">draft</span>
            ) : null}
        </div>
    );
};

ListItemPull.propTypes = propTypes;

export default ListItemPull;
