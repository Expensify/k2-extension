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
};
const defaultProps = {
    issues: null,
};

class ListIssuesAssigned extends React.Component {
    constructor(props) {
        super(props);

        this.state = {shouldHideHeldIssues: false};
        this.state = {shouldHideUnderReviewIssues: false};
        this.fetch = this.fetch.bind(this);
        this.toggleHeldFilter = this.toggleHeldFilter.bind(this);
        this.toggleUnderReviewFilter = this.toggleUnderReviewFilter.bind(this);
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
    }

    toggleUnderReviewFilter() {
        this.setState(prevState => ({shouldHideUnderReviewIssues: !prevState.shouldHideUnderReviewIssues}));
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
                                <input type="checkbox" name="shouldHideIfHeld" id="shouldHideIfHeld" onChange={this.toggleHeldFilter} />
                                On Hold
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input type="checkbox" name="shouldHideIfUnderReview" id="shouldHideIfUnderReview" onChange={this.toggleUnderReviewFilter} />
                                Under Review
                            </label>
                        </div>
                    </form>
                </div>
                <div className="d-flex flex-row">
                    <div className="col-3 pr-3">
                        <PanelIssues
                            title="Hourly"
                            extraClass="hourly"
                            data={_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Hourly'}))}
                            hideIfHeld={this.state.shouldHideHeldIssues}
                            hideIfUnderReview={this.state.shouldHideUnderReviewIssues}
                        />
                    </div>
                    <div className="col-3 pr-3">
                        <PanelIssues
                            title="Daily"
                            extraClass="daily"
                            data={_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Daily'}))}
                            hideIfHeld={this.state.shouldHideHeldIssues}
                            hideIfUnderReview={this.state.shouldHideUnderReviewIssues}
                        />
                    </div>
                    <div className="col-3 pr-3">
                        <PanelIssues
                            title="Weekly"
                            extraClass="weekly"
                            data={_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Weekly'}))}
                            hideIfHeld={this.state.shouldHideHeldIssues}
                            hideIfUnderReview={this.state.shouldHideUnderReviewIssues}
                        />
                    </div>
                    <div className="col-3">
                        <PanelIssues
                            title="Monthly"
                            extraClass="monthly"
                            data={_.pick(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Monthly'}))}
                            hideIfHeld={this.state.shouldHideHeldIssues}
                            hideIfUnderReview={this.state.shouldHideUnderReviewIssues}
                        />
                    </div>
                </div>
                <div className="pt-4">
                    <PanelIssues
                        title="No Priority"
                        extraClass="no-priority"
                        hideOnEmpty
                        // eslint-disable-next-line max-len
                        data={_.pick(this.props.issues, issue => _.intersection(_.map(issue.labels, label => label.name), ['Hourly', 'Daily', 'Weekly', 'Monthly']).length === 0)}
                        hideIfHeld={this.state.shouldHideHeldIssues}
                        hideIfUnderReview={this.state.shouldHideUnderReviewIssues}
                    />
                </div>
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
})(ListIssuesAssigned);
