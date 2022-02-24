import BtnGroup from '../../component/BtnGroup';
import * as API from '../../lib/api';

const React = require('react');
const _ = require('underscore');
const moment = require('moment');

const Members = require('../../lib/members');
const FireworkShow = require('../../component/fireworkShow');

export default React.createClass({
    propTypes() {
        return {
            // A callback that is triggered when we click the move up button
            onMoveUp: React.PropTypes.func,

            // A callback that is triggered when we click the move down button
            onMoveDown: React.PropTypes.func,
        };
    },

    getInitialState() {
        return {
            showCommentBar: false,
            lastComment: null,
            postingComment: false,
            commentText: 'Comment',
            quickBumpText: 'Bump',
            showConfirmKill: false,
            hideIssue: false,
        };
    },

    componentWillMount() {
        this.isPlanning = _.findWhere(this.props.data.labels, {name: 'Planning'}) ? ' planning' : '';
        this.isUnderReview = _.find(this.props.data.labels, l => l.name.toLowerCase() === 'reviewing');
        this.isOverdue = _.find(this.props.data.labels, l => l.name.toLowerCase() === 'overdue');
        this.isOnHold = this.props.data.title.toLowerCase().indexOf('[hold') > -1;
        this.isUnassigned = !this.props.data.assignee;
        this.isOnlyOnStaging = false;
        this.isOnStagingAndProduction = false;
        this.isClosed = this.props.data.state === 'closed';
    },

    componentDidMount() {
        API.getCommentsForIssue(this.props.data.number, (err, data) => {
            // Now that we have the comments, we can see where it's deployed to
            const deployedToStaging = _.find(data, (comment) => {
                const text = comment.body_html.toLowerCase();
                return (text.indexOf('deployed to') === 3 || text.indexOf('cherry picked to') === 3) && text.indexOf('/staging') > -1;
            });
            const deployedToProduction = _.find(data, (comment) => {
                const text = comment.body_html.toLowerCase();
                return (text.indexOf('deployed to') === 3 || text.indexOf('cherry picked to') === 3) && text.indexOf('/production') > -1;
            });
            this.isOnlyOnStaging = deployedToStaging && !deployedToProduction;
            this.isOnStagingAndProduction = deployedToStaging && deployedToProduction;

            // If it's on production, then we don't want to also show the "closed" label, so set it to false
            if (this.isOnStagingAndProduction) {
                this.isClosed = false;
            }

            // find the last comment done by the assignee
            this.setState({
                lastComment: _.chain(data)
                    .sortBy('created_at')
                    .reverse()
                    .find(comment => this.props.data.assignee && comment.user.login === this.props.data.assignee.login)
                    .value(),
            });
        });
    },

    /**
     * Returns the appropriate classes for displaying this issue
     *
     * @returns {String}
     */
    getClassName() {
        let className = 'issue link-gray-dark v-align-middle no-underline h5';

        // See if it's on hold
        if (this.isOnHold) {
            className += ' reviewing';
        }

        if (this.isOverdue) {
            className += ' overdue';
        }

        if (this.isUnassigned) {
            className += ' unassigned';
        }

        return className;
    },

    /**
     * Post a comment to the issue
     */
    postComment() {
        if (!this.commentField.value) {
            return;
        }

        const newComment = this.commentField.value;
        this.commentField.value = '';

        this.setState({
            postingComment: true,
            commentText: 'Commenting...',
        });

        API.postIusseComment(this.props.data.number, newComment, (err) => {
            if (err) {
                return;
            }

            setTimeout(() => {
                this.setState({
                    postingComment: false,
                    commentText: 'Comment',
                });
            }, 2000);
        });
    },

    toggleCommentBar() {
        this.setState({
            showCommentBar: !this.state.showCommentBar,
        });
    },

    /**
     * Post a quick bump to the assignee
     */
    postQuickBump() {
        if (this.commentField) {
            this.commentField.value = '';
        }

        this.setState({
            postingComment: true,
            quickBumpText: 'Bumping...',
        });

        const comment = `@${this.props.data.assignee.login} bump for an update`;
        API.postIusseComment(this.props.data.number, comment, (err) => {
            if (err) {
                return;
            }
            setTimeout(() => {
                this.setState({
                    postingComment: false,
                    quickBumpText: 'Bump',
                });
            }, 2000);
        });
    },

    /**
     * Show or hide the confirmation to remove an issue
     */
    toggleConfirmKill() {
        this.setState({
            showConfirmKill: !this.state.showConfirmKill,
        });
    },

    /**
     * Removes an issue from our dashboard by removing the what's next label
     */
    removeIssue() {
        this.setState({
            hideIssue: true,
        });
        API.removeLabel('WhatsNext', () => {}, this.props.data.number, 'expensify');
    },

    render() {
        if (this.state.hideIssue) {
            return <FireworkShow />;
        }

        const lastCommentDate = this.state.lastComment && moment(this.state.lastComment.created_at).fromNow();
        return (
            <li className="Box-row">
                <div className="pull-right actionbuttons">
                    <BtnGroup>
                        <button
                            type="button"
                            className={`btn tooltipped tooltipped-sw ${this.state.showCommentBar ? 'selected' : ''}`}
                            aria-label="Add comment"
                            onClick={this.toggleCommentBar}
                        >
                            <span role="img" aria-label="add comment">💬</span>
                        </button>
                        <button
                            type="button"
                            className="btn tooltipped tooltipped-sw"
                            aria-label="Increase issue priority"
                            onClick={this.props.onMoveUp}
                        >
                            <span role="img" aria-label="increase issue priority">▲</span>
                        </button>
                        <button
                            type="button"
                            className="btn tooltipped tooltipped-sw"
                            aria-label="Decrease issue priority"
                            onClick={this.props.onMoveDown}
                        >
                            <span role="img" aria-label="Decrease issue priority">▼</span>
                        </button>
                        {!this.state.showConfirmKill && (this.isClosed || this.isOnStagingAndProduction) && (
                        <button
                            type="button"
                            className="btn tooltipped tooltipped-sw"
                            aria-label="Remove issue from What's Next"
                            onClick={this.toggleConfirmKill}
                        >
                            <span role="img" aria-label="Remove issue from What's Next">☢</span>
                        </button>
                        )}
                        {this.state.showConfirmKill && (
                        <button
                            type="button"
                            className="btn"
                            onClick={this.removeIssue}
                        >
                            U sure?
                        </button>
                        )}
                        {this.state.showConfirmKill && (
                        <button
                            type="button"
                            className="btn"
                            onClick={this.toggleConfirmKill}
                        >
                            Cancel
                        </button>
                        )}
                        {this.props.data.assignee && (
                        <button
                            type="button"
                            className="btn tooltipped tooltipped-sw"
                            aria-label="Send a quick comment to bump the assignee for an update"
                            onClick={this.postQuickBump}
                        >
                            {this.state.quickBumpText}
                        </button>
                        )}
                    </BtnGroup>
                </div>


                <a href={this.props.data.html_url} className={this.getClassName()} target="_blank" rel="noreferrer">
                    {this.isUnassigned
                        ? <span className="label unassigned">UNASSIGNED</span>
                        : Members.getNameFromLogin(this.props.data.assignee.login)}
                    {' - '}
                    {this.props.data.title}
                    {' '}
                    {this.isClosed && <span className="label closed">Closed</span>}
                    {this.isPlanning && <span className="label planning">Planning</span>}
                    {this.isOnHold && <span className="label hold">HOLD</span>}
                    {this.isOverdue && <span className="label overdue">OVERDUE</span>}
                    {this.isUnderReview && <span className="label underreview">Under Review</span>}
                    {this.isOnlyOnStaging && <span className="label onstaging">On Staging</span>}
                    {this.isOnStagingAndProduction && <span className="label onproduction">On Production</span>}
                </a>

                {this.state.lastComment && (
                <div className={`timeline-comment-wrapper js-comment-container lastcomment ${this.isOnHold ? 'hold' : ''}`}>
                    <div dangerouslySetInnerHTML={{__html: `<em class="pull-left muted">(${lastCommentDate}):&nbsp;</em> ${this.state.lastComment.body_html}`}} />
                </div>
                )}

                {!this.isOnHold && this.state.showCommentBar && (
                <div className="form-inline">
                    {this.props.data.assignee && (
                        <button
                            type="button"
                            className="btn tooltipped tooltipped-sw"
                            aria-label="Send a quick comment to bump the assignee for an update"
                            onClick={this.postQuickBump}
                        >
                            {this.state.quickBumpText}
                        </button>
                    )}
                    {'   '}
                    or
                    {'   '}
                    <input
                        type="text"
                        className="form-control"
                        ref={el => this.commentField = el}
                        /* eslint-disable-next-line jsx-a11y/no-autofocus */
                        autoFocus="true"
                        placeholder={this.state.postingComment ? 'Posting...' : 'Post a comment'}
                    />
                    {' '}
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={this.postComment}
                    >
                        {this.state.commentText}
                    </button>
                </div>
                )}

            </li>
        );
    },
});
