import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import * as Issues from '../../lib/actions/Issues';
import PanelIssues from '../../component/panel/PanelIssues';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** All the GH issues assigned to the current user */
    issues: PropTypes.objectOf(IssuePropTypes),

    checkboxes: PropTypes.shape({
        /** Should issues that are on HOLD be hidden? */
        shouldHideOnHold: PropTypes.bool,

        /** Should issues with "reviewing" label be hidden? */
        shouldHideUnderReview: PropTypes.bool,

        /** Should issues owned by someone else be hidden? */
        shouldHideOwnedBySomeoneElse: PropTypes.bool,

        /** Should issues that are not overdue be hidden? */
        shouldHideNotOverdue: PropTypes.bool,
    }),
};
const defaultProps = {
    issues: null,
    checkboxes: {
        shouldHideOnHold: false,
        shouldHideUnderReview: false,
        shouldHideOwnedBySomeoneElse: false,
        shouldHideNotOverdue: false,
    },
};

class ListIssuesAssigned extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            shouldHideHeldIssues: props.checkboxes.shouldHideOnHold,
            shouldHideUnderReviewIssues: props.checkboxes.shouldHideUnderReview,
            shouldHideOwnedBySomeoneElseIssues: props.checkboxes.shouldHideOwnedBySomeoneElse,
            shouldHideNotOverdueIssues: props.checkboxes.shouldHideNotOverdue,

            // searchInputText is the immediate value shown in the input field
            // searchText is the debounced value used for filtering
            searchInputText: '',
            searchText: '',
        };
        this.fetch = this.fetch.bind(this);
        this.toggleHeldFilter = this.toggleHeldFilter.bind(this);
        this.toggleUnderReviewFilter = this.toggleUnderReviewFilter.bind(this);
        this.toggleOwnedBySomeoneElseFilter = this.toggleOwnedBySomeoneElseFilter.bind(this);
        this.toggleNotOverdueFilter = this.toggleNotOverdueFilter.bind(this);
        this.applySearchFilter = this.applySearchFilter.bind(this);
        this.applyDebouncedSearchFilter = _.debounce(this.applyDebouncedSearchFilter.bind(this), 300);
    }

    componentDidMount() {
        this.fetch();

        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }

        // Cancel any pending debounced search
        this.applyDebouncedSearchFilter.cancel();
    }

    applySearchFilter(event) {
        const value = event.target.value;

        // Update input text immediately for responsive UI
        this.setState({searchInputText: value});

        // Debounce the actual filtering
        this.applyDebouncedSearchFilter(value);
    }

    applyDebouncedSearchFilter(value) {
        this.setState({searchText: value});
    }

    toggleHeldFilter() {
        this.setState(prevState => ({shouldHideHeldIssues: !prevState.shouldHideHeldIssues}));
        Issues.saveCheckboxes({shouldHideOnHold: !this.state.shouldHideHeldIssues});
    }

    toggleNotOverdueFilter() {
        this.setState(prevState => ({shouldHideNotOverdueIssues: !prevState.shouldHideNotOverdueIssues}));
        Issues.saveCheckboxes({shouldHideNotOverdue: !this.state.shouldHideNotOverdueIssues});
    }

    toggleOwnedBySomeoneElseFilter() {
        this.setState(prevState => ({shouldHideOwnedBySomeoneElseIssues: !prevState.shouldHideOwnedBySomeoneElseIssues}));
        Issues.saveCheckboxes({shouldHideOwnedBySomeoneElse: !this.state.shouldHideOwnedBySomeoneElseIssues});
    }

    toggleUnderReviewFilter() {
        this.setState(prevState => ({shouldHideUnderReviewIssues: !prevState.shouldHideUnderReviewIssues}));
        Issues.saveCheckboxes({shouldHideUnderReview: !this.state.shouldHideUnderReviewIssues});
    }

    fetch() {
        Issues.getAllAssigned();
    }

    /**
     * Parse search text into structured filters
     * Supports:
     * - label:"Label Name" or label:labelname for label inclusion
     * - -label:"Label Name" or -label:labelname for label exclusion
     * - Regular text terms for title search (with - prefix for exclusion)
     *
     * @param {string} searchText - The search text to parse
     * @returns {Object} Object containing includeLabels, excludeLabels, includeTerms, excludeTerms arrays
     */
    parseSearchText(searchText) {
        const includeLabels = [];
        const excludeLabels = [];
        const includeTerms = [];
        const excludeTerms = [];

        // Match label:"quoted value" or label:unquoted patterns (with optional - prefix)
        const labelPattern = /(-?)label:(?:"([^"]+)"|(\S+))/gi;
        let remaining = searchText;
        const matches = searchText.match(labelPattern) || [];

        _.each(matches, (matchStr) => {
            // Re-parse each match to extract components
            const singleMatch = /(-?)label:(?:"([^"]+)"|(\S+))/i.exec(matchStr);
            if (singleMatch) {
                const isExclusion = singleMatch[1] === '-';
                const labelValue = (singleMatch[2] || singleMatch[3]).toLowerCase();

                if (isExclusion) {
                    excludeLabels.push(labelValue);
                } else {
                    includeLabels.push(labelValue);
                }

                // Remove matched pattern from remaining text
                remaining = remaining.replace(matchStr, ' ');
            }
        });

        // Parse remaining text for regular title search terms
        const textTerms = _.filter(remaining.trim().split(/\s+/), term => term.length > 0);
        _.each(textTerms, (term) => {
            if (term.startsWith('-') && term.length > 1) {
                excludeTerms.push(term.slice(1).toLowerCase());
            } else {
                includeTerms.push(term.toLowerCase());
            }
        });

        return {
            includeLabels,
            excludeLabels,
            includeTerms,
            excludeTerms,
        };
    }

    filterIssues(issues) {
        const {
            includeLabels, excludeLabels, includeTerms, excludeTerms,
        } = this.parseSearchText(this.state.searchText);

        return _.filter(issues, (item) => {
            if (this.state.shouldHideHeldIssues && item.title.toLowerCase().indexOf('[hold') > -1 ? ' hold' : '') {
                return false;
            }
            if (this.state.shouldHideUnderReviewIssues && _.find(item.labels, label => label.name.toLowerCase() === 'reviewing')) {
                return false;
            }
            if (this.state.shouldHideOwnedBySomeoneElseIssues && item.issueHasOwner && !item.currentUserIsOwner) {
                return false;
            }
            if (this.state.shouldHideNotOverdueIssues && !_.find(item.labels, label => label.name.toLowerCase() === 'overdue')) {
                return false;
            }

            // Get all label names for this issue (lowercase for comparison)
            const itemLabels = _.map(item.labels, label => label.name.toLowerCase());

            // Must have ALL include labels
            const hasAllIncludeLabels = _.every(includeLabels, label => _.some(itemLabels, itemLabel => itemLabel.indexOf(label) !== -1));
            if (!hasAllIncludeLabels) {
                return false;
            }

            // Must NOT have ANY exclude labels
            const hasAnyExcludeLabel = _.some(excludeLabels, label => _.some(itemLabels, itemLabel => itemLabel.indexOf(label) !== -1));
            if (hasAnyExcludeLabel) {
                return false;
            }

            // Free text search filter (case insensitive)
            // Title must contain ALL include terms
            const titleLower = item.title.toLowerCase();
            const matchesAllIncludes = _.every(includeTerms, term => titleLower.indexOf(term) !== -1);
            if (!matchesAllIncludes) {
                return false;
            }

            // Title must NOT contain ANY exclude terms
            const matchesAnyExclude = _.some(excludeTerms, term => titleLower.indexOf(term) !== -1);
            if (matchesAnyExclude) {
                return false;
            }

            return true;
        });
    }

    render() {
        const hourlyIssues = this.filterIssues(_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Hourly'})));
        const dailyIssues = this.filterIssues(_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Daily'})));
        const weeklyIssues = this.filterIssues(_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Weekly'})));
        const monthlyIssues = this.filterIssues(_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Monthly'})));
        const issuesNoLabel = this.filterIssues(
            _.pick(this.props.issues, issue => _.intersection(_.map(issue.labels, label => label.name), ['Hourly', 'Daily', 'Weekly', 'Monthly']).length === 0),
        );

        // Doesn't matter what the column size is if there are no columns, just make sure we don't divide by 0
        const numColumns = _.filter([hourlyIssues, dailyIssues, weeklyIssues, monthlyIssues], col => !_.isEmpty(col)).length;
        const columnSize = numColumns === 0 ? -1 : 12 / numColumns;

        if (!this.props.issues) {
            return (
                <div className="blankslate capped clean-background">
                    Loading
                </div>
            );
        }

        if (!_.size(this.props.issues)) {
            return (
                <div className="blankslate capped clean-background">
                    No items
                </div>
            );
        }

        return (
            <div className="mb-3">
                <div className="panel-title issue-filter mb-2">
                    <form className="form-inline">
                        Hide:
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="shouldHideIfHeld"
                                    id="shouldHideIfHeld"
                                    onChange={this.toggleHeldFilter}
                                    checked={this.state.shouldHideHeldIssues ? 'checked' : undefined}
                                />
                                On Hold
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="shouldHideIfUnderReview"
                                    id="shouldHideIfUnderReview"
                                    onChange={this.toggleUnderReviewFilter}
                                    checked={this.state.shouldHideUnderReviewIssues ? 'checked' : undefined}
                                />
                                Under Review
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="shouldHideIfOwnedBySomeoneElse"
                                    id="shouldHideIfOwnedBySomeoneElse"
                                    onChange={this.toggleOwnedBySomeoneElseFilter}
                                    checked={this.state.shouldHideOwnedBySomeoneElseIssues ? 'checked' : undefined}
                                />
                                Owned by Someone Else
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="shouldHideIfNotOverdue"
                                    id="shouldHideIfNotOverdue"
                                    onChange={this.toggleNotOverdueFilter}
                                    checked={this.state.shouldHideNotOverdueIssues ? 'checked' : undefined}
                                />
                                Not Overdue
                            </label>
                        </div>
                        <input
                            type="text"
                            placeholder="Filter Issues by Title"
                            className="search-filter-input"
                            value={this.state.searchInputText}
                            onChange={this.applySearchFilter}
                        />
                    </form>
                </div>
                {!_.isEmpty(this.props.issues) && (
                    <div className="d-flex flex-row gap-3">
                        <PanelIssues
                            title="Hourly"
                            key="hourly"
                            extraClass="hourly"
                            wrapperClass={`col-${columnSize}`}
                            hideOnEmpty
                            data={hourlyIssues}
                        />
                        <PanelIssues
                            title="Daily"
                            key="daily"
                            extraClass="daily"
                            wrapperClass={`col-${columnSize}`}
                            hideOnEmpty
                            data={dailyIssues}
                        />
                        <PanelIssues
                            title="Weekly"
                            key="weekly"
                            extraClass="weekly"
                            wrapperClass={`col-${columnSize}`}
                            hideOnEmpty
                            data={weeklyIssues}
                        />
                        <PanelIssues
                            title="Monthly"
                            key="monthly"
                            extraClass="monthly"
                            wrapperClass={`col-${columnSize}`}
                            hideOnEmpty
                            data={monthlyIssues}
                        />
                    </div>
                )}
                <PanelIssues
                    title="No Priority"
                    key="no-priority"
                    extraClass="no-priority"
                    wrapperClass="pt-4"
                    hideOnEmpty
                    data={issuesNoLabel}
                />
            </div>
        );
    }
}

ListIssuesAssigned.propTypes = propTypes;
ListIssuesAssigned.defaultProps = defaultProps;

export default withOnyx({
    issues: {
        key: ONYXKEYS.ISSUES.ASSIGNED,
    },
    checkboxes: {
        key: ONYXKEYS.ISSUES.CHECKBOXES,
    },
})(ListIssuesAssigned);
