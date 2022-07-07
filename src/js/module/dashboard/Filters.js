import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import * as Milestones from '../../lib/actions/Milestones';
import * as Issues from '../../lib/actions/Issues';
import ONYXKEYS from '../../ONYXKEYS';

const propTypes = {
    /** Data for milestones in GH */
    milestones: PropTypes.objectOf(PropTypes.shape({
        /** The GH ID of the milestone */
        id: PropTypes.string.isRequired,

        /** The title of the milestone */
        title: PropTypes.string.isRequired,
    })),

    /** The filters to apply to the GH issues */
    filters: PropTypes.shape({
        /** Should improvements be included? */
        improvement: PropTypes.bool,

        /** Should tasks be included? */
        task: PropTypes.bool,

        /** Should features be included? */
        feature: PropTypes.bool,

        /** A milestone the issues should belong to */
        milestone: PropTypes.string,
    }),
};
const defaultProps = {
    milestones: {},
    filters: {},
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

        if (!this.props.filters || _.isEmpty(this.props.filters)) {
            return;
        }

        this.fieldImprovement.checked = this.props.filters.improvement;
        this.fieldTask.checked = this.props.filters.task;
        this.fieldFeature.checked = this.props.filters.feature;
        $(this.fieldMilestone).val(this.props.filters.milestone);
    }

    /**
     * Save the filters when the apply button is clicked
     *
     * @param {SyntheticEvent} e
     */
    saveFilters(e) {
        e.preventDefault();

        Issues.saveFilters({
            improvement: this.fieldImprovement.checked,
            task: this.fieldTask.checked,
            feature: this.fieldFeature.checked,
            milestone: this.fieldMilestone.value,
        });
    }

    render() {
        return (
            <div className="mb-3">
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
    filters: {
        key: ONYXKEYS.ISSUES.FILTER,
    },
})(Filters);
