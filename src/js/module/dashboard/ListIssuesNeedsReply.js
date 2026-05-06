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

    /** Issues where the current user has been mentioned but hasn't replied */
    issues: PropTypes.objectOf(IssuePropTypes),
};
const defaultProps = {
    issues: null,
    initialDelay: 0,
};

class ListIssuesNeedsReply extends React.Component {
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
        Issues.getNeedsReply();
    }

    render() {
        if (this.props.issues && !_.size(this.props.issues)) {
            return null;
        }

        return (
            <div className="panel needs-reply mb-3">
                <Title
                    text="Needs Reply"
                    count={_.size(this.props.issues) || 0}
                    onOpenAll={() => openAllUrls(this.props.issues)}
                    items={
                        this.props.issues ? _.values(this.props.issues) : null
                    }
                />

                {!this.props.issues && (
                    <div className="blankslate capped clean-background">
                        Loading
                    </div>
                )}

                {_.chain(this.props.issues)
                    .sortBy('updatedAt')
                    .map(issue => (
                        <ListItemIssue key={issue.id} issue={issue} />
                    ))
                    .value()
                    .reverse()}
            </div>
        );
    }
}

ListIssuesNeedsReply.propTypes = propTypes;
ListIssuesNeedsReply.defaultProps = defaultProps;

export default withOnyx({
    issues: {
        key: ONYXKEYS.ISSUES.NEEDS_REPLY,
    },
})(ListIssuesNeedsReply);
