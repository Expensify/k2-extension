import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import {Stack} from '@primer/react';
import * as Issues from '../../lib/actions/Issues';
import EmptyState from '../../component/EmptyState';
import PresetFilterBar from '../../component/filters/PresetFilterBar';
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
        shouldHideOnHold: true,
        shouldHideUnderReview: true,
        shouldHideOwnedBySomeoneElse: true,
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
        this.applySearchFilter = this.applySearchFilter.bind(this);
        this.applyDebouncedSearchFilter = _.debounce(this.applyDebouncedSearchFilter.bind(this), 300);
        this.updateFilters = this.updateFilters.bind(this);
        this.clearFilters = this.clearFilters.bind(this);
        this.applyPreset = this.applyPreset.bind(this);
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

    updateFilters(filters) {
        const checkboxUpdates = {};
        if (_.has(filters, 'shouldHideHeldIssues')) {
            checkboxUpdates.shouldHideOnHold = filters.shouldHideHeldIssues;
        }
        if (_.has(filters, 'shouldHideUnderReviewIssues')) {
            checkboxUpdates.shouldHideUnderReview = filters.shouldHideUnderReviewIssues;
        }
        if (_.has(filters, 'shouldHideOwnedBySomeoneElseIssues')) {
            checkboxUpdates.shouldHideOwnedBySomeoneElse = filters.shouldHideOwnedBySomeoneElseIssues;
        }
        if (_.has(filters, 'shouldHideNotOverdueIssues')) {
            checkboxUpdates.shouldHideNotOverdue = filters.shouldHideNotOverdueIssues;
        }
        this.setState(filters);
        Issues.saveCheckboxes(checkboxUpdates);
    }

    clearFilters() {
        this.updateFilters({
            shouldHideHeldIssues: false,
            shouldHideUnderReviewIssues: false,
            shouldHideOwnedBySomeoneElseIssues: false,
            shouldHideNotOverdueIssues: false,
        });
    }

    applyPreset(preset) {
        if (preset === 'actionable') {
            this.updateFilters({
                shouldHideHeldIssues: true,
                shouldHideUnderReviewIssues: true,
                shouldHideOwnedBySomeoneElseIssues: true,
                shouldHideNotOverdueIssues: false,
            });
            return;
        }
        if (preset === 'overdue') {
            this.updateFilters({
                shouldHideHeldIssues: false,
                shouldHideUnderReviewIssues: false,
                shouldHideOwnedBySomeoneElseIssues: false,
                shouldHideNotOverdueIssues: true,
            });
            return;
        }
        if (preset === 'mine') {
            this.updateFilters({
                shouldHideHeldIssues: false,
                shouldHideUnderReviewIssues: false,
                shouldHideOwnedBySomeoneElseIssues: true,
                shouldHideNotOverdueIssues: false,
            });
            return;
        }
        this.clearFilters();
    }

    fetch() {
        Issues.getAllAssigned();
    }

    /**
     * Parse search text into structured filters
     * Supports:
     * - label:"Label Name" or label:labelname for label filtering (with - prefix for exclusion)
     * - Regular text terms for title search (with - prefix for exclusion)
     *
     * @param {string} searchText - The search text to parse
     * @returns {Object}
     */
    parseSearchText(searchText) {
        const includeLabels = [];
        const excludeLabels = [];
        const includeTerms = [];
        const excludeTerms = [];

        // Match label:"quoted value" or label:unquoted patterns (with optional - prefix)
        // Named capture groups: exclude (-), quoted (value in quotes), unquoted (value without quotes)
        const labelPattern = /(?<exclude>-?)label:(?:"(?<quoted>[^"]+)"|(?<unquoted>\S+))/gi;
        let remaining = searchText;
        const matches = searchText.match(labelPattern) || [];

        _.each(matches, (matchStr) => {
            // Re-parse each match to extract named capture groups
            const singleMatch = /(?<exclude>-?)label:(?:"(?<quoted>[^"]+)"|(?<unquoted>\S+))/i.exec(matchStr);
            if (singleMatch && singleMatch.groups) {
                const isExclusion = singleMatch.groups.exclude === '-';
                const labelValue = (singleMatch.groups.quoted || singleMatch.groups.unquoted).toLowerCase();

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

        if (!this.props.issues) {
            return <EmptyState isLoading />;
        }

        if (!_.size(this.props.issues)) {
            return <EmptyState />;
        }

        const presets = [
            {
                id: 'actionable',
                label: 'Actionable',
                description: 'Shows issues you own or that are unowned, excluding on hold and under review.',
                active: this.state.shouldHideHeldIssues
                    && this.state.shouldHideUnderReviewIssues
                    && this.state.shouldHideOwnedBySomeoneElseIssues
                    && !this.state.shouldHideNotOverdueIssues,
                onSelect: () => this.applyPreset('actionable'),
            },
            {
                id: 'overdue',
                label: 'Overdue',
                description: 'Shows only issues labeled Overdue.',
                active: !this.state.shouldHideHeldIssues
                    && !this.state.shouldHideUnderReviewIssues
                    && !this.state.shouldHideOwnedBySomeoneElseIssues
                    && this.state.shouldHideNotOverdueIssues,
                onSelect: () => this.applyPreset('overdue'),
            },
            {
                id: 'mine',
                label: 'Mine',
                description: 'Shows issues you own plus issues that do not have an owner.',
                active: !this.state.shouldHideHeldIssues
                    && !this.state.shouldHideUnderReviewIssues
                    && this.state.shouldHideOwnedBySomeoneElseIssues
                    && !this.state.shouldHideNotOverdueIssues,
                onSelect: () => this.applyPreset('mine'),
            },
            {
                id: 'all',
                label: 'All',
                description: 'Shows all assigned issues without status or ownership exclusions.',
                active: !this.state.shouldHideHeldIssues
                    && !this.state.shouldHideUnderReviewIssues
                    && !this.state.shouldHideOwnedBySomeoneElseIssues
                    && !this.state.shouldHideNotOverdueIssues,
                onSelect: () => this.applyPreset('all'),
            },
        ];
        return (
            <Stack gap="condensed">
                <PresetFilterBar
                    searchPlaceholder="Filter issues by title or label"
                    searchValue={this.state.searchInputText}
                    onSearch={this.applySearchFilter}
                    presets={presets}
                />
                {!_.isEmpty(this.props.issues) && (
                    <div className="k2-priority-grid">
                        <PanelIssues
                            title="Hourly"
                            key="hourly"
                            extraClass="hourly"
                            wrapperClass=""
                            hideOnEmpty
                            data={hourlyIssues}
                        />
                        <PanelIssues
                            title="Daily"
                            key="daily"
                            extraClass="daily"
                            wrapperClass=""
                            hideOnEmpty
                            data={dailyIssues}
                        />
                        <PanelIssues
                            title="Weekly"
                            key="weekly"
                            extraClass="weekly"
                            wrapperClass=""
                            hideOnEmpty
                            data={weeklyIssues}
                        />
                        <PanelIssues
                            title="Monthly"
                            key="monthly"
                            extraClass="monthly"
                            wrapperClass=""
                            hideOnEmpty
                            data={monthlyIssues}
                        />
                    </div>
                )}
                <PanelIssues
                    title="No Priority"
                    key="no-priority"
                    extraClass="no-priority"
                    wrapperClass="k2-no-priority"
                    hideOnEmpty
                    data={issuesNoLabel}
                />
            </Stack>
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
