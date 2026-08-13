import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import Title from '../../component/panel-title/Title';
import ListItemPull from '../../component/list-item/ListItemPull';
import FilterBar from '../../component/filters/FilterBar';
import * as PullRequests from '../../lib/actions/PullRequests';
import openAllUrls from '../../lib/openAllUrls';
import EmptyState from '../../component/EmptyState';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** All the PRs assigned to the current user */
    prs: PropTypes.objectOf(IssuePropTypes),

    checkboxes: PropTypes.shape({
        /** Should draft PRs be hidden? */
        shouldHideDraft: PropTypes.bool,

        /** Should PRs that have already been reviewed be hidden? */
        shouldHideAlreadyReviewed: PropTypes.bool,

        /** Should PRs that are on hold be hidden? */
        shouldHideOnHold: PropTypes.bool,
    }),

    filterUIOption: PropTypes.string.isRequired,
};
const defaultProps = {
    prs: null,
    checkboxes: {
        shouldHideDraft: false,
        shouldHideAlreadyReviewed: false,
        shouldHideOnHold: false,
    },
};

class ListPRsReviewing extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            shouldHideDraft: props.checkboxes.shouldHideDraft,
            shouldHideAlreadyReviewed: props.checkboxes.shouldHideAlreadyReviewed,
            shouldHideOnHold: props.checkboxes.shouldHideOnHold,

            // searchInputText is the immediate value shown in the input field
            // searchText is the debounced value used for filtering
            searchInputText: '',
            searchText: '',
            viewFilter: 'custom',
        };

        this.fetch = this.fetch.bind(this);
        this.toggleDraftFilter = this.toggleDraftFilter.bind(this);
        this.toggleAlreadyReviewedFilter = this.toggleAlreadyReviewedFilter.bind(this);
        this.toggleOnHoldFilter = this.toggleOnHoldFilter.bind(this);
        this.applySearchFilter = this.applySearchFilter.bind(this);
        this.applyDebouncedSearchFilter = _.debounce(this.applyDebouncedSearchFilter.bind(this), 300);
        this.filterPRs = this.filterPRs.bind(this);
        this.clearFilters = this.clearFilters.bind(this);
        this.applyPreset = this.applyPreset.bind(this);
        this.updateFilters = this.updateFilters.bind(this);
    }

    componentDidMount() {
        this.fetch();
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }

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

    toggleDraftFilter() {
        this.updateFilters({shouldHideDraft: !this.state.shouldHideDraft});
    }

    toggleAlreadyReviewedFilter() {
        this.updateFilters({shouldHideAlreadyReviewed: !this.state.shouldHideAlreadyReviewed});
    }

    toggleOnHoldFilter() {
        this.updateFilters({shouldHideOnHold: !this.state.shouldHideOnHold});
    }

    updateFilters(filters, viewFilter = 'custom') {
        this.setState({...filters, viewFilter});
        PullRequests.saveCheckboxes(filters);
    }

    clearFilters() {
        this.updateFilters({
            shouldHideDraft: false,
            shouldHideAlreadyReviewed: false,
            shouldHideOnHold: false,
        });
    }

    applyPreset(preset) {
        if (preset === 'actionable') {
            this.updateFilters({
                shouldHideDraft: true,
                shouldHideAlreadyReviewed: true,
                shouldHideOnHold: true,
            });
            return;
        }
        if (preset === 'reviewed' || preset === 'draft') {
            this.updateFilters({
                shouldHideDraft: false,
                shouldHideAlreadyReviewed: false,
                shouldHideOnHold: false,
            }, preset);
            return;
        }
        this.clearFilters();
    }

    fetch() {
        PullRequests.getReviewing();

        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    filterPRs(prs) {
        const terms = _.filter(this.state.searchText.trim().split(/\s+/), term => term.length > 0);
        const includeTerms = [];
        const excludeTerms = [];
        _.each(terms, (term) => {
            if (term.startsWith('-') && term.length > 1) {
                excludeTerms.push(term.slice(1).toLowerCase());
            } else {
                includeTerms.push(term.toLowerCase());
            }
        });

        return _.filter(prs, (pr) => {
            if (this.state.viewFilter === 'reviewed' && pr.isReviewRequested !== false) {
                return false;
            }
            if (this.state.viewFilter === 'draft' && !pr.isDraft) {
                return false;
            }
            if (this.state.shouldHideDraft && pr.isDraft) {
                return false;
            }
            if (this.state.shouldHideAlreadyReviewed && pr.isReviewRequested === false) {
                return false;
            }
            if (this.state.shouldHideOnHold && (pr.title.indexOf('[HOLD') > -1 || pr.title.indexOf('[WIP') > -1)) {
                return false;
            }

            const titleLower = pr.title.toLowerCase();
            const matchesAllIncludes = _.every(includeTerms, term => titleLower.indexOf(term) !== -1);
            if (!matchesAllIncludes) {
                return false;
            }

            const matchesAnyExclude = _.some(excludeTerms, term => titleLower.indexOf(term) !== -1);
            if (matchesAnyExclude) {
                return false;
            }

            return true;
        });
    }

    render() {
        if (this.props.prs && !_.size(this.props.prs)) {
            return null;
        }

        const filteredPRs = this.props.prs ? this.filterPRs(this.props.prs) : [];
        const filters = [
            {
                id: 'draft', label: 'Hide drafts', active: this.state.shouldHideDraft, onSelect: this.toggleDraftFilter,
            },
            {
                id: 'reviewed', label: 'Hide reviewed', active: this.state.shouldHideAlreadyReviewed, onSelect: this.toggleAlreadyReviewedFilter,
            },
            {
                id: 'hold', label: 'Hide on hold', active: this.state.shouldHideOnHold, onSelect: this.toggleOnHoldFilter,
            },
        ];
        if (this.state.viewFilter === 'reviewed' || this.state.viewFilter === 'draft') {
            filters.push({
                id: `${this.state.viewFilter}-only`,
                label: `${this.state.viewFilter === 'reviewed' ? 'Reviewed' : 'Draft'} only`,
                active: true,
                onSelect: this.clearFilters,
            });
        }
        const isCustomView = this.state.viewFilter === 'custom';
        const presets = [
            {
                id: 'actionable',
                label: 'Actionable',
                active: isCustomView && this.state.shouldHideDraft && this.state.shouldHideAlreadyReviewed && this.state.shouldHideOnHold,
                onSelect: () => this.applyPreset('actionable'),
            },
            {
                id: 'all',
                label: 'All',
                active: isCustomView && !this.state.shouldHideDraft && !this.state.shouldHideAlreadyReviewed && !this.state.shouldHideOnHold,
                onSelect: () => this.applyPreset('all'),
            },
            {
                id: 'reviewed-only', label: 'Reviewed', active: this.state.viewFilter === 'reviewed', onSelect: () => this.applyPreset('reviewed'),
            },
            {
                id: 'draft-only', label: 'Draft', active: this.state.viewFilter === 'draft', onSelect: () => this.applyPreset('draft'),
            },
        ];
        const structuredMenus = [
            {
                id: 'review-status',
                label: 'Review status',
                items: [
                    {
                        id: 'review-any', label: 'Any', active: isCustomView && !this.state.shouldHideAlreadyReviewed, onSelect: () => this.updateFilters({shouldHideAlreadyReviewed: false}),
                    },
                    {
                        id: 'needs-review',
                        label: 'Needs my review',
                        active: isCustomView && this.state.shouldHideAlreadyReviewed,
                        onSelect: () => this.updateFilters({shouldHideAlreadyReviewed: true}),
                    },
                    {
                        id: 'reviewed-only', label: 'Reviewed only', active: this.state.viewFilter === 'reviewed', onSelect: () => this.applyPreset('reviewed'),
                    },
                ],
            },
            {
                id: 'pr-state',
                label: 'State',
                items: [
                    {
                        id: 'state-any',
                        label: 'Any',
                        active: isCustomView && !this.state.shouldHideDraft && !this.state.shouldHideOnHold,
                        onSelect: () => this.updateFilters({shouldHideDraft: false, shouldHideOnHold: false}),
                    },
                    {
                        id: 'state-active',
                        label: 'Active only',
                        active: isCustomView && this.state.shouldHideDraft && this.state.shouldHideOnHold,
                        onSelect: () => this.updateFilters({shouldHideDraft: true, shouldHideOnHold: true}),
                    },
                    {
                        id: 'state-draft', label: 'Draft only', active: this.state.viewFilter === 'draft', onSelect: () => this.applyPreset('draft'),
                    },
                ],
            },
        ];

        return (
            <div>
                <FilterBar
                    mode={this.props.filterUIOption}
                    searchPlaceholder="Filter PRs by title"
                    searchValue={this.state.searchInputText}
                    onSearch={this.applySearchFilter}
                    onClear={this.clearFilters}
                    filters={filters}
                    presets={presets}
                    structuredMenus={structuredMenus}
                />

                <section className="k2-panel k2-panel-daily" aria-label="Pull requests to review daily">
                    <Title
                        text="Review these PRs Daily"
                        count={_.size(filteredPRs)}
                        onOpenAll={() => openAllUrls(filteredPRs)}
                    />

                    {!this.props.prs && (
                        <EmptyState isLoading />
                    )}

                    {_.chain(filteredPRs)
                        .sortBy('updatedAt')
                        .map(pr => <ListItemPull key={pr.id} pr={pr} />)
                        .value()
                        .reverse()}
                </section>
            </div>
        );
    }
}

ListPRsReviewing.propTypes = propTypes;
ListPRsReviewing.defaultProps = defaultProps;

export default withOnyx({
    prs: {
        key: ONYXKEYS.PRS.REVIEWING,
    },
    checkboxes: {
        key: ONYXKEYS.PRS.CHECKBOXES,
    },
})(ListPRsReviewing);
