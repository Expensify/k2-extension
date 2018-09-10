'use strict';

const React = require('react');
const _ = require('underscore');

const API = require('../../lib/api');
const Milestone = require('./milestone');
const MilestoneStore = require('../../store/milestones');

module.exports = React.createClass({
  currentView: 'resync',

  getInitialState() {
    return {
      isLoading: true,
      milestones: []
    };
  },

  componentDidMount() {
    // Fetch our milestones
    API.getMilestones(this.currentView, (err, milestones) => {
      if (err) {
        console.error(err);
        return;
      }

      this.setState({
        isLoading: false,
        milestones
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
        milestones: newMilestones
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
        milestones: newMilestones
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
        milestones: newMilestones
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
        milestones: newMilestones
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

    const partitionedMilestones = _(this.state.milestones).partition(m => !m.hidden);
    const shownMilestones = partitionedMilestones[0] || [];
    const hiddenMilestones = partitionedMilestones[1] || [];

    return (
      <div>
        {_(shownMilestones).map(m => (<Milestone
          key={m.id}
          data={m}
          onHide={this.hide}
          onMoveUp={this.moveUp}
          onMoveDown={this.moveDown}
        />))}

        {hiddenMilestones.length > 0 && <div>
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
              {_(hiddenMilestones).chain().sortBy(m => m.title.toLowerCase()).map(m => (<Milestone
                key={m.id}
                data={m}
                onShow={this.show}
              />)).value()}
            </ul>
          </div>
        </div>}
      </div>
    );
  }
});
