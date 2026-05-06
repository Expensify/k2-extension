import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import ListItemIssue from '../../component/list-item/ListItemIssue';
import Title from '../../component/panel-title/Title';
import * as Issues from '../../lib/actions/Issues';
import openAllUrls from '../../lib/openAllUrls';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** Initial delay before first fetch (ms) to stagger API calls */
    initialDelay: PropTypes.number,

    /** All the Hot Pick issues */
    issues: PropTypes.arrayOf(IssuePropTypes),
};
const defaultProps = {
    issues: [],
    initialDelay: 0,
};

class ListIssuesHotPicks extends React.Component {
    constructor(props) {
        super(props);

        this.fetch = this.fetch.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    componentDidMount() {
        this.initialTimeout = setTimeout(() => {
            this.fetch();

            if (this.props.pollInterval && !this.interval) {
                this.interval = setInterval(
                    this.fetch,
                    this.props.pollInterval,
                );
            }
        }, this.props.initialDelay);

        document.addEventListener(
            'visibilitychange',
            this.handleVisibilityChange,
        );
    }

    componentWillUnmount() {
        document.removeEventListener(
            'visibilitychange',
            this.handleVisibilityChange,
        );
        if (this.initialTimeout) {
            clearTimeout(this.initialTimeout);
        }
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        } else {
            this.fetch();
            if (this.props.pollInterval && !this.interval) {
                this.interval = setInterval(
                    this.fetch,
                    this.props.pollInterval,
                );
            }
        }
    }

    fetch() {
        Issues.getHotPicks();
    }

    render() {
        return (
            <div className="panel waq mb-3">
                <Title
                    text="Hot Picks"
                    count={this.props.issues.length}
                    onOpenAll={() => openAllUrls(this.props.issues)}
                    items={this.props.issues}
                />

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
                        {_.map(this.props.issues, issue => (
                            <ListItemIssue
                                key={issue.id}
                                issue={issue}
                                showAttendees
                            />
                        ))}
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
