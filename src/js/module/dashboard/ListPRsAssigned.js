import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import Title from '../../component/panel-title/Title';
import ListItemPull from '../../component/list-item/ListItemPull';
import * as PullRequests from '../../lib/actions/PullRequests';
import * as Preferences from '../../lib/actions/Preferences';
import openAllUrls from '../../lib/openAllUrls';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** All the PRs assigned to the current user */
    prs: PropTypes.objectOf(IssuePropTypes),

    /** The preferences of the current user */
    preferences: PropTypes.shape({
        /** Whether the repo tag also shows the number of the PR */
        shouldShowPRNumbers: PropTypes.bool,
    }),
};
const defaultProps = {
    prs: null,
    preferences: {},
};

class ListPRsAssigned extends React.Component {
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
        PullRequests.getAssigned();

        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    render() {
        if (this.props.prs && !_.size(this.props.prs)) {
            return null;
        }

        // Defaults to true so the numbers show until the user turns them off.
        const shouldShowPRNumbers = this.props.preferences.shouldShowPRNumbers !== false;

        return (
            <div className="panel your-pull-requests mb-3">
                <Title
                    text="Your Pull Requests"
                    count={_.size(this.props.prs) || 0}
                    onOpenAll={() => openAllUrls(this.props.prs)}
                    checkbox={{
                        id: 'shouldShowPRNumbers',
                        label: 'Show PR numbers',
                        isChecked: shouldShowPRNumbers,
                        onChange: () => Preferences.setShouldShowPRNumbers(!shouldShowPRNumbers),
                    }}
                />

                {!this.props.prs && (
                    <div className="blankslate capped clean-background">
                        Loading
                    </div>
                )}

                {_.chain(this.props.prs)
                    .sortBy('updatedAt')
                    .map(pr => (
                        <ListItemPull
                            key={pr.id}
                            pr={pr}
                            shouldShowNumber={shouldShowPRNumbers}
                        />
                    ))
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
    preferences: {
        key: ONYXKEYS.PREFERENCES,
    },
})(ListPRsAssigned);
