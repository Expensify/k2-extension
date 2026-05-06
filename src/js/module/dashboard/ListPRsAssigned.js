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

    /** Initial delay before first fetch (ms) to stagger API calls */
    initialDelay: PropTypes.number,

    /** All the PRs assigned to the current user */
    prs: PropTypes.objectOf(IssuePropTypes),
};
const defaultProps = {
    prs: null,
    initialDelay: 0,
};

class ListPRsAssigned extends React.Component {
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
        PullRequests.getAssigned();
    }

    render() {
        if (this.props.prs && !_.size(this.props.prs)) {
            return null;
        }

        return (
            <div className="panel your-pull-requests mb-3">
                <Title
                    text="Your Pull Requests"
                    count={_.size(this.props.prs) || 0}
                    onOpenAll={() => openAllUrls(this.props.prs)}
                    items={this.props.prs ? _.values(this.props.prs) : null}
                />

                {!this.props.prs && (
                    <div className="blankslate capped clean-background">
                        Loading
                    </div>
                )}

                {_.chain(this.props.prs)
                    .sortBy('updatedAt')
                    .map(pr => <ListItemPull key={pr.id} pr={pr} />)
                    .value()
                    .reverse()}
            </div>
        );
    }
}

ListPRsAssigned.propTypes = propTypes;
ListPRsAssigned.defaultProps = defaultProps;

export default withOnyx({
    prs: {
        key: ONYXKEYS.PRS.ASSIGNED,
    },
})(ListPRsAssigned);
