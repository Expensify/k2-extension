import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import * as Milestones from '../../lib/actions/Milestones';
import * as Issues from '../../lib/actions/Issues';
import * as SavedSearches from '../../lib/actions/SavedSearches';
import ONYXKEYS from '../../ONYXKEYS';
import filterPropTypes from '../../lib/filterPropTypes';

const savedSearchShape = PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    filters: PropTypes.object,
    createdAt: PropTypes.number,
});

const propTypes = {
    /** Data for milestones in GH */
    milestones: PropTypes.objectOf(PropTypes.shape({
        /** The GH ID of the milestone */
        id: PropTypes.string.isRequired,

        /** The title of the milestone */
        title: PropTypes.string.isRequired,
    })),

    /** The filters to apply to the GH issues */
    filters: filterPropTypes,

    /** List of saved filter presets */
    savedSearches: PropTypes.arrayOf(savedSearchShape),
};
const defaultProps = {
    milestones: {},
    filters: {},
    savedSearches: [],
};

class Filters extends React.Component {
    constructor(props) {
        super(props);

        this.saveFilters = this.saveFilters.bind(this);
        this.saveCurrentSearch = this.saveCurrentSearch.bind(this);
        this.applySavedSearch = this.applySavedSearch.bind(this);
        this.renameSavedSearch = this.renameSavedSearch.bind(this);
        this.deleteSavedSearch = this.deleteSavedSearch.bind(this);
    }

    componentDidMount() {
        Milestones.get();
        SavedSearches.getSavedSearches();
    }

    componentDidUpdate(prevProps) {
        const milestonesChanged = this.props.milestones !== prevProps.milestones;
        const filtersChanged = !_.isEqual(this.props.filters, prevProps.filters);
        if (!milestonesChanged && !filtersChanged) {
            return;
        }

        if (!this.props.filters || _.isEmpty(this.props.filters)) {
            return;
        }

        this.fieldImprovement.checked = this.props.filters.improvement;
        this.fieldTask.checked = this.props.filters.task;
        this.fieldFeature.checked = this.props.filters.feature;
        $(this.fieldMilestone).val(this.props.filters.milestone);
        if (this.fieldTitleFilter) {
            this.fieldTitleFilter.value = this.props.filters.titleFilter || '';
        }
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
            titleFilter: this.fieldTitleFilter ? this.fieldTitleFilter.value.trim() : '',
        });
    }

    getCurrentFilters() {
        return {
            improvement: this.fieldImprovement ? this.fieldImprovement.checked : true,
            task: this.fieldTask ? this.fieldTask.checked : true,
            feature: this.fieldFeature ? this.fieldFeature.checked : true,
            milestone: this.fieldMilestone ? this.fieldMilestone.value : '',
            titleFilter: this.fieldTitleFilter ? this.fieldTitleFilter.value.trim() : '',
        };
    }

    saveCurrentSearch(e) {
        e.preventDefault();
        const name = window.prompt('Name this saved search:');
        if (name == null) return;
        const filters = this.getCurrentFilters();
        SavedSearches.saveSavedSearch(name, filters);
    }

    applySavedSearch(id) {
        SavedSearches.applySavedSearch(id);
    }

    renameSavedSearch(id) {
        const saved = _.findWhere(this.props.savedSearches, {id});
        if (!saved) return;
        const newName = window.prompt('Rename saved search:', saved.name);
        if (newName == null) return;
        SavedSearches.renameSavedSearch(id, newName);
    }

    deleteSavedSearch(id) {
        if (!window.confirm('Delete this saved search?')) return;
        SavedSearches.deleteSavedSearch(id);
    }

    render() {
        return (
            <div className="mb-3">
                <form className="form-inline" onSubmit={this.saveFilters}>
                    Filter by:
                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="improvement" ref={el => this.fieldImprovement = el} />
                            Improvement
                        </label>
                    </div>

                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="task" ref={el => this.fieldTask = el} />
                            Task
                        </label>
                    </div>

                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="feature" ref={el => this.fieldFeature = el} />
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

                    <div className="checkbox">
                        <label htmlFor="titleFilter">
                            Search by title:&nbsp;
                        </label>
                        <input
                            id="titleFilter"
                            type="text"
                            name="titleFilter"
                            placeholder="Filter by issue title..."
                            ref={el => this.fieldTitleFilter = el}
                            defaultValue={this.props.filters && this.props.filters.titleFilter ? this.props.filters.titleFilter : ''}
                        />
                    </div>

                    <button type="submit" className="btn btn-default">Apply</button>
                    <button type="button" className="btn btn-default ml-2" onClick={this.saveCurrentSearch}>
                        Save search
                    </button>
                </form>
                {_.size(this.props.savedSearches) > 0 && (
                    <div className="mt-2">
                        <strong>Saved searches:</strong>
                        <ul className="list-unstyled mt-1">
                            {_.map(this.props.savedSearches, saved => (
                                <li key={saved.id} className="mb-1 d-flex align-items-center gap-2">
                                    <span className="flex-grow-1">{saved.name}</span>
                                    <button
                                        type="button"
                                        className="btn btn-default btn-sm"
                                        onClick={() => this.applySavedSearch(saved.id)}
                                    >
                                        Apply
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-default btn-sm"
                                        onClick={() => this.renameSavedSearch(saved.id)}
                                    >
                                        Rename
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-default btn-sm"
                                        onClick={() => this.deleteSavedSearch(saved.id)}
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
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
    savedSearches: {
        key: ONYXKEYS.SAVED_SEARCHES,
    },
})(Filters);
