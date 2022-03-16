import React from 'react';
import moment from 'moment';
import AssigneeNone from '../assignee/AssigneeNone';
import Assignee from '../assignee/Assignee';

export default React.createClass({

    /**
     * Gets the class name for the item
     *
     * @date 2015-06-10
     *
     * @return {string}
     */
    getClassName() {
        let className = 'issue';
        const today = moment();
        const days = 7;

        // See if it's overdue
        const isOverdue = moment(this.props.data.updated_at).isBefore(today.subtract(days, 'days'), 'day');

        if (isOverdue) {
            className += ' overdue';
        }

        if (this.props.data.title.indexOf('[HOLD') > -1
        || this.props.data.title.indexOf('[WIP') > -1) {
            className += ' hold';
        }

        return className;
    },

    render() {
        if (!this.props.data.pr || this.props.data.pr.merged) {
            // This should not be reached unless there is a GitHub API error. Since we
            // have seen some such errors, filter out already-merged PRs or PRs with
            // missing data.
            return null;
        }

        let person = '';
        const mergeableState = this.props.data.pr.mergeable_state || 'unknown';
        let mergeability = '';

        switch (mergeableState) {
            case 'dirty':
                mergeability = 'Merge Conflicts';
                break;
            case 'blocked':
                if (!this.props.data.reviews || !this.props.data.reviews.length) {
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

        // If we are showing the assignee, we need to figure which template to display
        if (this.props.options.showAssignee) {
            if (this.props.data.assignee) {
                person = <Assignee html_url={this.props.data.html_url} login={this.props.data.login} />;
            } else {
                person = <AssigneeNone />;
            }
        }

        return (
            <div className="panel-item">

                <span className="panel-item-meta">
                    {person}

                    <span className="age">
                        Updated:
                        {moment(this.props.data.updated_at).fromNow()}
                    </span>
                    <span className="comments">
                        Comments:
                        {' '}
                        {this.props.data.comments}
                    </span>

                    {this.props.showReviews ? (
                        <span className="comments">
                            Reviews:
                            {' '}
                            {this.props.data.reviews.length}
                        </span>
                    ) : null}

                    {this.props.data.pr.status && this.props.data.pr.status.length && this.props.data.pr.status[0].state
                        ? (
                            <span className={`travis-status ${this.props.data.pr.status[0].state}`}>
                                Travis:
                                {' '}
                                {this.props.data.pr.status[0].state}
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
                <a href={this.props.data.html_url} className={this.getClassName()} target="_blank" rel="noreferrer">
                    <span className="octicon octicon-alert" />
                    {this.props.data.title}
                    {' '}
                </a>

                {this.props.data.userIsFinishedReviewing ? (
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
    },
});
