import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import * as Issues from '../../lib/actions/Issues';
import PanelListRaw from '../../component/panel/PanelListRaw';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** All the GH issues assigned to the current user */
    issues: PropTypes.arrayOf(IssuePropTypes),
};
const defaultProps = {
    issues: null,
};

class ListIssuesAssigned extends React.Component {
    constructor(props) {
        super(props);

        this.fetch = this.fetch.bind(this);
    }

    componentDidMount() {
        this.fetch();
    }

    componentWillUnmount() {
        if (!this.interval) {
            return;
        }
        clearInterval(this.interval);
    }

    fetch() {
        Issues.getAllAssigned();

        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
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
            <div>
                <div className="d-flex flex-row">
                    <div className="col-3 pr-4">
                        <PanelListRaw
                            title="Hourly"
                            extraClass="hourly"
                            item="issue"
                            data={_.filter(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Hourly'}))}
                        />
                    </div>
                    <div className="col-3 pr-4">
                        <PanelListRaw
                            title="Daily"
                            extraClass="daily"
                            item="issue"
                            data={_.filter(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Daily'}))}
                        />
                    </div>
                    <div className="col-3 pr-4">
                        <PanelListRaw
                            title="Weekly"
                            extraClass="weekly"
                            item="issue"
                            data={_.filter(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Weekly'}))}
                        />
                    </div>
                    <div className="col-3">
                        <PanelListRaw
                            title="Monthly"
                            extraClass="monthly"
                            item="issue"
                            data={_.filter(this.props.issues, issue => _.findWhere(issue.labels, {name: 'Monthly'}))}
                        />
                    </div>
                </div>
                <div className="pt-4">
                    <PanelListRaw
                        title="None"
                        extraClass="none"
                        item="issue"
                        data={_.filter(this.props.issues, issue => _.intersection(_.map(issue.labels, label => label.name), ['Hourly', 'Daily', 'Weekly', 'Monthly']).length === 0)}
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
