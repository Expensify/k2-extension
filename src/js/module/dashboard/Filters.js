import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import * as prefs from '../../lib/prefs';
import * as Milestones from '../../lib/actions/Milestones';
import ONYXKEYS from '../../ONYXKEYS';

const propTypes = {
    /** Data for milestones in GH */
    milestones: PropTypes.objectOf(PropTypes.shape({
        /** The GH ID of the milestone */
        id: PropTypes.string.isRequired,

        /** The title of the milestone */
        title: PropTypes.string.isRequired,
    })),

    /** A callback that is triggered when a filter has changed */
    onChange: PropTypes.func.isRequired,
};
const defaultProps = {
    milestones: {},
};

class Filters extends React.Component {
    constructor(props) {
        super(props);

        this.saveFilters = this.saveFilters.bind(this);
    }

    componentDidMount() {
        Milestones.get();
    }

    componentDidUpdate(prevProps) {
        if (this.props.milestones === prevProps.milestones) {
            return;
        }
        this.updateFilterFields();
    }

    updateFilterFields() {
        prefs.get('issueFilters', (issueFilters) => {
            if (!issueFilters || _.isEmpty(issueFilters)) {
                return;
            }
            this.fieldImprovement.checked = issueFilters.improvement;
            this.fieldTask.checked = issueFilters.task;
            this.fieldFeature.checked = issueFilters.feature;
            $(this.fieldMilestone).val(issueFilters.milestone);
        });
    }

    /**
     * Handle the form being submitted
     *
     * @param {SyntheticEvent} e
     */
    saveFilters(e) {
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
        this.props.onChange(newFilters);
    }

    render() {
        return (
            <div className="">
                <form className="form-inline" onSubmit={this.saveFilters}>
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
                        <label htmlFor="milestone">
                            Milestone:&nbsp;
                        </label>
                        <select id="milestone" name="milestone" ref={el => this.fieldMilestone = el}>
                            <option value="">-All Milestones-</option>
                            {_.map(this.props.milestones, option => (
                                <option value={option.id} key={option.id}>{option.title}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="btn btn-default">Apply</button>
                </form>
            </div>
        );
    }
}

Filters.propTypes = propTypes;
Filters.defaultProps = defaultProps;

export default withOnyx({
    milestones: {
        key: ONYXKEYS.MILESTONES,
    },
})(Filters);
