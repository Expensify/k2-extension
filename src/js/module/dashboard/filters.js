import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import * as prefs from '../../lib/prefs';
import * as API from '../../lib/api';

module.exports = React.createClass({
    propTypes: {
        filter: React.PropTypes.func.isRequired,
    },

    getInitialState() {
        return {
            milestones: [],
        };
    },

    componentDidMount() {
        API.getMilestones('all', (err, milestones) => {
            if (err) {
                return;
            }

            const newState = {
                milestones: _.chain(milestones)
                    .sortBy('title')
                    .map(milestone => ({
                        text: milestone.title,
                        value: milestone.id,
                    }))
                    .unshift({text: '-All Milestones-', value: ''})
                    .value(),
            };

            this.setState(newState, this.updateFilterFields);
        });
    },

    updateFilterFields() {
        prefs.get('issueFilters', (issueFilters) => {
            if (issueFilters && !_.isEmpty(issueFilters)) {
                this.fieldImprovement.checked = issueFilters.improvement;
                this.fieldTask.checked = issueFilters.task;
                this.fieldFeature.checked = issueFilters.feature;
                $(this.fieldMilestone).val(issueFilters.milestone);
            }
        });
    },

    /**
     * Handle the form being submitted
     *
     * @param {SyntheticEvent} e
     */
    submit(e) {
        e.preventDefault();

        // Get our filter values
        const newFilters = {
            improvement: this.fieldImprovement.checked,
            task: this.fieldTask.checked,
            feature: this.fieldFeature.checked,
            milestone: this.fieldMilestone.value,
        };

        prefs.set('issueFilters', newFilters);

        // Trigger our filter callback
        this.props.filter(newFilters);
    },

    render() {
        return (
            <div className="">
                <form className="form-inline" onSubmit={this.submit}>
                    Filter by:
                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="improvement" ref={el => this.fieldImprovement = el} />
                            {' '}
                            Improvement
                        </label>
                    </div>

                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="task" ref={el => this.fieldTask = el} />
                            {' '}
                            Task
                        </label>
                    </div>

                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="feature" ref={el => this.fieldFeature = el} />
                            {' '}
                            New Feature
                        </label>
                    </div>

                    <div className="checkbox">
                        <label>
                            Milestone:&nbsp;
                        </label>
                        <select name="milestone" ref={el => this.fieldMilestone = el}>
                            {_.map(this.state.milestones, option => (
                                <option value={option.value} key={option.value}>{option.text}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="btn btn-default">Apply</button>
                </form>
            </div>
        );
    },
});
