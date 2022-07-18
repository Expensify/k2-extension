import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import Title from '../../component/panel-title/Title';
import ListItemIssue from '../../component/list-item/ListItemIssue';
import * as Issues from '../../lib/actions/Issues';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** All the daily improvement issues */
    issues: PropTypes.objectOf(IssuePropTypes),
};
const defaultProps = {
    prs: null,
};

class ListIssuesDailyImprovements extends React.Component {
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
        Issues.getDailyImprovements();

        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    render() {
        return (
            <div className="panel mb-3">
                <Title text="Daily Improvements (All Areas)" />

                {!this.props.prs && (
                    <div className="blankslate capped clean-background">
                        Loading
                    </div>
                )}

                {this.props.prs && !_.size(this.props.prs) && (
                    <div className="blankslate capped clean-background">
                        No items
                    </div>
                )}

                {_.chain(this.props.issues)
                    .sortBy('updatedAt')
                    .map(pr => <ListItemIssue key={pr.id} data={issue} />)
                    .value()
                    .reverse()}
            </div>
        );
    }
}

ListIssuesDailyImprovements.propTypes = propTypes;
ListIssuesDailyImprovements.defaultProps = defaultProps;

export default withOnyx({
    issues: {
        key: ONYXKEYS.ISSUES.DAILY_IMPROVEMENTS,
    },
})(ListIssuesDailyImprovements);
