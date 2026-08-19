import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import {Stack} from '@primer/react';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import Title from '../../component/panel-title/Title';
import ListItemPull from '../../component/list-item/ListItemPull';
import PresetFilterBar from '../../component/filters/PresetFilterBar';
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
};
const defaultProps = {
    prs: null,
    checkboxes: {
        shouldHideDraft: true,
        shouldHideAlreadyReviewed: true,
        shouldHideOnHold: true,
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
            if (!pr || !pr.id || typeof pr.title !== 'string') {
                return false;
            }
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
        const isCustomView = this.state.viewFilter === 'custom';
        const presets = [
            {
                id: 'actionable',
                label: 'Actionable',
                description: 'Excludes drafts, PRs already reviewed, and PRs on hold or marked WIP.',
                active: isCustomView && this.state.shouldHideDraft && this.state.shouldHideAlreadyReviewed && this.state.shouldHideOnHold,
                onSelect: () => this.applyPreset('actionable'),
            },
            {
                id: 'reviewed-only',
                label: 'Reviewed',
                description: 'Shows only PRs you have already reviewed.',
                active: this.state.viewFilter === 'reviewed',
                onSelect: () => this.applyPreset('reviewed'),
            },
            {
                id: 'draft-only',
                label: 'Draft',
                description: 'Shows only draft PRs.',
                active: this.state.viewFilter === 'draft',
                onSelect: () => this.applyPreset('draft'),
            },
            {
                id: 'all',
                label: 'All',
                description: 'Shows every PR in the review queue.',
                active: isCustomView && !this.state.shouldHideDraft && !this.state.shouldHideAlreadyReviewed && !this.state.shouldHideOnHold,
                onSelect: () => this.applyPreset('all'),
            },
        ];

        return (
            <Stack gap="condensed">
                <PresetFilterBar
                    searchPlaceholder="Filter PRs by title"
                    searchValue={this.state.searchInputText}
                    onSearch={this.applySearchFilter}
                    presets={presets}
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
            </Stack>
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
