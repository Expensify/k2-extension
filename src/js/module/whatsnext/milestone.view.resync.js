
const React = require('react');
const _ = require('underscore');

const API = require('../../lib/api');
const Members = require('../../lib/members');
const Milestone = require('./milestone');
const MilestoneStore = require('../../store/milestones');

module.exports = React.createClass({
    propTypes() {
        return {
            // A callback function that is triggered when the data has been loaded initially
            onLoad: React.PropTypes.func,
        };
    },

    currentView: 'resync',

    getInitialState() {
        return {
            isLoading: true,
            isLoadingIssues: false,
            milestones: [],
        };
    },

    componentDidMount() {
        let milestones;

        // Render the milestones after all our async calls are made
        const done = _.after(2, () => {
            this.setState({
                isLoading: false,
                milestones,
            }, this.props.onLoad);
        });

        // Fetch our milestones
        API.getMilestones(this.currentView, (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            milestones = data;
            done();
        });

        // Initialize our member lib so that we can have access to members when the milestones are rendered
        Members.init((err) => {
            if (err) {
                console.error(err);
                return;
            }
            done();
        });
    },

    /**
   * Make this view show the loading state
   * @public
   */
    showLoadingState() {
        this.setState({
            isLoadingIssues: true,
        });
    },

    /**
   * Make this view hide the loading state and show the milestones
   * @public
   * @param {Object[]} issues
   */
    hideLoadingStateAndShowIssues(issues) {
        MilestoneStore.addIssuesToMilestones(this.currentView, issues, this.state.milestones, (data) => {
            this.setState({
                isLoadingIssues: false,
                milestones: data,
            });
        });
    },

    /**
   * Change a milestone from hidden to being visible
   * @param {Number} id
   */
    show(id) {
        MilestoneStore.show(this.currentView, id, this.state.milestones, (newMilestones) => {
            this.setState({
                milestones: newMilestones,
            });
        });
    },

    /**
   * Change a milestone from being visible to being hidden
   * @param {Number} id
   */
    hide(id) {
        MilestoneStore.hide(this.currentView, id, this.state.milestones, (newMilestones) => {
            this.setState({
                milestones: newMilestones,
            });
        });
    },

    /**
   * Change the order of milestones by moving this one up
   * @param {Number} id
   */
    moveUp(id) {
        MilestoneStore.moveUp(this.currentView, id, this.state.milestones, (newMilestones) => {
            this.setState({
                milestones: newMilestones,
            });
        });
    },

    /**
   * Change the order of milestones by moving this one down
   * @param {Number} id
   */
    moveDown(id) {
        MilestoneStore.moveDown(this.currentView, id, this.state.milestones, (newMilestones) => {
            this.setState({
                milestones: newMilestones,
            });
        });
    },

    /**
   * Change the order of issues in a milestone by moving this one up
   * @param {Number} milestoneId
   * @param {Number} issueId
   */
    moveIssueUp(milestoneId, issueId) {
        MilestoneStore.moveIssueUp(this.currentView, milestoneId, issueId, this.state.milestones, (newMilestones) => {
            this.setState({
                milestones: newMilestones,
            });
        });
    },

    /**
   * Change the order of issues in a milestone by moving this one down
   * @param {Number} milestoneId
   * @param {Number} issueId
   */
    moveIssueDown(milestoneId, issueId) {
        MilestoneStore.moveIssueDown(this.currentView, milestoneId, issueId, this.state.milestones, (newMilestones) => {
            this.setState({
                milestones: newMilestones,
            });
        });
    },

    render() {
        if (this.state.isLoading) {
            return (
                <div>
                    Loading...
                </div>
            );
        }

        if (!this.state.milestones.length) {
            return (
                <div>
                    No milestones today.
                </div>
            );
        }

        const partitionedMilestones = _.partition(this.state.milestones, m => !m.hidden);
        const shownMilestones = partitionedMilestones[0] || [];
        const hiddenMilestones = partitionedMilestones[1] || [];

        return (
            <div>
                {_.map(shownMilestones, m => (
                    <Milestone
                        key={m.id}
                        data={m}
                        onHide={this.hide}
                        onMoveUp={this.moveUp}
                        onMoveDown={this.moveDown}
                        onMoveIssueUp={id => this.moveIssueUp(m.id, id)}
                        onMoveIssueDown={id => this.moveIssueDown(m.id, id)}
                        loading={this.state.isLoadingIssues}
                    />
                ))}

                {hiddenMilestones.length > 0 && (
                <div>
                    <div className="table-list-header">
                        <div className="table-list-filters">
                            <div className="table-list-header-toggle float-left">
                                <div className="table-list-header-meta">
                                    Hidden Milestones
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-right border-bottom border-left">
                        <ul>
                            {_.chain(hiddenMilestones).sortBy(m => m.title.toLowerCase()).map(m => (
                                <Milestone
                                    key={m.id}
                                    data={m}
                                    onShow={this.show}
                                />
                            )).value()}
                        </ul>
                    </div>
                </div>
                )}
            </div>
        );
    },
});
