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
        };
        this.fetch = this.fetch.bind(this);
        this.toggleHeldFilter = this.toggleHeldFilter.bind(this);
        this.toggleUnderReviewFilter = this.toggleUnderReviewFilter.bind(this);
        this.toggleOwnedBySomeoneElseFilter = this.toggleOwnedBySomeoneElseFilter.bind(this);
        this.toggleNotOverdueFilter = this.toggleNotOverdueFilter.bind(this);
    }

    componentDidMount() {
        this.fetch();

        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    componentWillUnmount() {
        if (!this.interval) {
            return;
        }
        clearInterval(this.interval);
    }

    fetch() {
        Issues.getAllAssigned();
    }

    toggleHeldFilter() {
        this.setState(prevState => ({shouldHideHeldIssues: !prevState.shouldHideHeldIssues}));
        Issues.saveCheckboxes({shouldHideOnHold: !this.state.shouldHideHeldIssues});
    }

    toggleUnderReviewFilter() {
        this.setState(prevState => ({shouldHideUnderReviewIssues: !prevState.shouldHideUnderReviewIssues}));
        Issues.saveCheckboxes({shouldHideUnderReview: !this.state.shouldHideUnderReviewIssues});
    }

    toggleOwnedBySomeoneElseFilter() {
        this.setState(prevState => ({shouldHideOwnedBySomeoneElseIssues: !prevState.shouldHideOwnedBySomeoneElseIssues}));
        Issues.saveCheckboxes({shouldHideOwnedBySomeoneElse: !this.state.shouldHideOwnedBySomeoneElseIssues});
    }

    toggleNotOverdueFilter() {
        this.setState(prevState => ({shouldHideNotOverdueIssues: !prevState.shouldHideNotOverdueIssues}));
        Issues.saveCheckboxes({shouldHideNotOverdue: !this.state.shouldHideNotOverdueIssues});
    }

    render() {
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
                    </form>
                </div>
                {!_.isEmpty(this.props.issues) && (
                    <div className="d-flex flex-row gap-3">
                        <PanelIssues
                            title="Hourly"
                            key="hourly"
                            extraClass="hourly"
                            wrapperClass="flex-fill"
                            hideOnEmpty
                            data={_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Hourly'}))}
                            hideIfHeld={this.state.shouldHideHeldIssues}
                            hideIfUnderReview={this.state.shouldHideUnderReviewIssues}
                            hideIfOwnedBySomeoneElse={this.state.shouldHideOwnedBySomeoneElseIssues}
                            hideIfNotOverdue={this.state.shouldHideNotOverdueIssues}
                        />
                        <PanelIssues
                            title="Daily"
                            key="daily"
                            extraClass="daily"
                            wrapperClass="flex-fill"
                            hideOnEmpty
                            data={_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Daily'}))}
                            hideIfHeld={this.state.shouldHideHeldIssues}
                            hideIfUnderReview={this.state.shouldHideUnderReviewIssues}
                            hideIfOwnedBySomeoneElse={this.state.shouldHideOwnedBySomeoneElseIssues}
                            hideIfNotOverdue={this.state.shouldHideNotOverdueIssues}
                        />
                        <PanelIssues
                            title="Weekly"
                            key="weekly"
                            extraClass="weekly"
                            wrapperClass="flex-fill"
                            hideOnEmpty
                            data={_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Weekly'}))}
                            hideIfHeld={this.state.shouldHideHeldIssues}
                            hideIfUnderReview={this.state.shouldHideUnderReviewIssues}
                            hideIfOwnedBySomeoneElse={this.state.shouldHideOwnedBySomeoneElseIssues}
                            hideIfNotOverdue={this.state.shouldHideNotOverdueIssues}
                        />
                        <PanelIssues
                            title="Monthly"
                            key="monthly"
                            extraClass="monthly"
                            wrapperClass="flex-fill"
                            hideOnEmpty
                            data={_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Monthly'}))}
                            hideIfHeld={this.state.shouldHideHeldIssues}
                            hideIfUnderReview={this.state.shouldHideUnderReviewIssues}
                            hideIfOwnedBySomeoneElse={this.state.shouldHideOwnedBySomeoneElseIssues}
                            hideIfNotOverdue={this.state.shouldHideNotOverdueIssues}
                        />
                    </div>
                )}
                <PanelIssues
                    title="No Priority"
                    key="no-priority"
                    extraClass="no-priority"
                    wrapperClass="pt-4"
                    hideOnEmpty
                    data={_.pick(this.props.issues, issue => _.intersection(_.map(issue.labels, label => label.name), ['Hourly', 'Daily', 'Weekly', 'Monthly']).length === 0)}
                    hideIfHeld={this.state.shouldHideHeldIssues}
                    hideIfUnderReview={this.state.shouldHideUnderReviewIssues}
                    hideIfOwnedBySomeoneElse={this.state.shouldHideOwnedBySomeoneElseIssues}
                    hideIfNotOverdue={this.state.shouldHideNotOverdueIssues}
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
