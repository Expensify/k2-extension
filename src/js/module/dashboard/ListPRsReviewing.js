import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import Title from '../../component/panel-title/Title';
import ListItemPull from '../../component/list-item/ListItemPull';
import * as PullRequests from '../../lib/actions/PullRequests';
import openAllUrls from '../../lib/openAllUrls';

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
        };

        this.fetch = this.fetch.bind(this);
        this.toggleDraftFilter = this.toggleDraftFilter.bind(this);
        this.toggleAlreadyReviewedFilter = this.toggleAlreadyReviewedFilter.bind(this);
        this.toggleOnHoldFilter = this.toggleOnHoldFilter.bind(this);
        this.applySearchFilter = this.applySearchFilter.bind(this);
        this.applyDebouncedSearchFilter = _.debounce(this.applyDebouncedSearchFilter.bind(this), 300);
        this.filterPRs = this.filterPRs.bind(this);
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
        this.setState(prevState => ({shouldHideDraft: !prevState.shouldHideDraft}));
        PullRequests.saveCheckboxes({shouldHideDraft: !this.state.shouldHideDraft});
    }

    toggleAlreadyReviewedFilter() {
        this.setState(prevState => ({shouldHideAlreadyReviewed: !prevState.shouldHideAlreadyReviewed}));
        PullRequests.saveCheckboxes({shouldHideAlreadyReviewed: !this.state.shouldHideAlreadyReviewed});
    }

    toggleOnHoldFilter() {
        this.setState(prevState => ({shouldHideOnHold: !prevState.shouldHideOnHold}));
        PullRequests.saveCheckboxes({shouldHideOnHold: !this.state.shouldHideOnHold});
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

        return (
            <div className="mb-3">
                <div className="panel-title issue-filter mb-2">
                    <form className="form-inline">
                        Hide:
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="shouldHideDraft"
                                    id="shouldHideDraft"
                                    onChange={this.toggleDraftFilter}
                                    checked={this.state.shouldHideDraft ? 'checked' : undefined}
                                />
                                Draft
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="shouldHideAlreadyReviewed"
                                    id="shouldHideAlreadyReviewed"
                                    onChange={this.toggleAlreadyReviewedFilter}
                                    checked={this.state.shouldHideAlreadyReviewed ? 'checked' : undefined}
                                />
                                Already reviewed
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="shouldHideOnHold"
                                    id="shouldHideOnHold"
                                    onChange={this.toggleOnHoldFilter}
                                    checked={this.state.shouldHideOnHold ? 'checked' : undefined}
                                />
                                On Hold
                            </label>
                        </div>
                        <input
                            type="text"
                            placeholder="Filter PRs by Title"
                            className="search-filter-input"
                            value={this.state.searchInputText}
                            onChange={this.applySearchFilter}
                        />
                    </form>
                </div>

                <div className="panel daily">
                    <Title
                        text="Review these PRs Daily"
                        count={_.size(filteredPRs)}
                        onOpenAll={() => openAllUrls(filteredPRs)}
                    />

                    {!this.props.prs && (
                        <div className="blankslate capped clean-background">
                            Loading
                        </div>
                    )}

                    {_.chain(filteredPRs)
                        .sortBy('updatedAt')
                        .map(pr => <ListItemPull key={pr.id} pr={pr} />)
                        .value()
                        .reverse()}
                </div>
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
