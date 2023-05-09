import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import * as Issues from '../../lib/actions/Issues';
import PanelIssues from '../../component/Panel/PanelIssues';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import filterPropTypes from '../../lib/filterPropTypes';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** All the GH issues assigned to the current user */
    issues: PropTypes.objectOf(IssuePropTypes),

    /** The filters to apply to the GH issues */
    filters: filterPropTypes,
};
const defaultProps = {
    issues: null,
    filters: {},
};

class ListIssuesAssigned extends React.Component {
    constructor(props) {
        super(props);

        this.fetch = this.fetch.bind(this);
        this.filterIssues = this.filterIssues.bind(this);
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

    filterIssues(issues) {
        let filteredIssues = issues;
        if (this.props.filters.hideHold) {
            filteredIssues = _.filter(issues, (issue) => {
                const regExp = /^\[.*Hold.*\]/ig;
                return !regExp.exec(issue.title);
            });
        }

        return filteredIssues;
    }

    render() {
        const issues = this.filterIssues(this.props.issues);
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
                <div className="d-flex flex-row">
                    <div className="col-3 pr-4">
                        <PanelIssues
                            panelID="Hourly"
                            title="Hourly"
                            extraClass="hourly"
                            data={_.pick(issues, issue => _.findWhere(issue.labels, {name: 'Hourly'}))}
                        />
                    </div>
                    <div className="col-3 pr-4">
                        <PanelIssues
                            panelID="Daily"
                            title="Daily"
                            extraClass="daily"
                            data={_.pick(issues, issue => _.findWhere(issue.labels, {name: 'Daily'}))}
                        />
                    </div>
                    <div className="col-3 pr-4">
                        <PanelIssues
                            panelID="Weekly"
                            title="Weekly"
                            extraClass="weekly"
                            data={_.pick(issues, issue => _.findWhere(issue.labels, {name: 'Weekly'}))}
                        />
                    </div>
                    <div className="col-3">
                        <PanelIssues
                            panelID="Monthly"
                            title="Monthly"
                            extraClass="monthly"
                            data={_.pick(issues, issue => _.findWhere(issue.labels, {name: 'Monthly'}))}
                        />
                    </div>
                </div>
                <div className="pt-4">
                    <PanelIssues
                        panelID="no-priority"
                        title="No Priority"
                        extraClass="no-priority"
                        hideOnEmpty
                        // eslint-disable-next-line max-len
                        data={_.pick(issues, issue => _.intersection(_.map(issue.labels, label => label.name), ['Hourly', 'Daily', 'Weekly', 'Monthly']).length === 0)}
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
    filters: {
        key: ONYXKEYS.ISSUES.FILTER,
    },
})(ListIssuesAssigned);
