import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import ListItemIssue from '../../component/list-item/ListItemIssue';
import * as Issues from '../../lib/actions/Issues';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** All the Hot Pick issues */
    issues: PropTypes.arrayOf(IssuePropTypes),
};
const defaultProps = {
    issues: [],
};

class ListIssuesHotPicks extends React.Component {
    constructor(props) {
        super(props);

        // By default show only issues assigned to the current user
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
        Issues.getHotPicks();

        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    render() {
        return (
            <div className="panel waq mb-3">
                <div className="d-flex flex-row">
                    <div className="col-12">
                        <h3 className="panel-title">
                            Hot Picks
                            {' '}
                            (
                            {this.props.issues.length}
                            )
                        </h3>
                    </div>
                </div>

                {!this.props.issues && (
                    <div className="blankslate capped clean-background">
                        Loading
                    </div>
                )}

                {!this.props.issues.length ? (
                    <div className="blankslate capped clean-background">
                        No items
                    </div>
                ) : (
                    <>
                        {_.map(this.props.issues, issue => <ListItemIssue key={issue.id} issue={issue} showAttendees />)}
                    </>
                )}

            </div>
        );
    }
}

ListIssuesHotPicks.propTypes = propTypes;
ListIssuesHotPicks.defaultProps = defaultProps;

export default withOnyx({
    issues: {
        key: ONYXKEYS.ISSUES.HOTPICKS,
    },
})(ListIssuesHotPicks);
