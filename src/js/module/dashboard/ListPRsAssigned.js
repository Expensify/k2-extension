import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import ReactNativeOnyx, {withOnyx} from 'react-native-onyx';
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
};
const defaultProps = {
    prs: null,
};

class ListPRsAssigned extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showPRNumbers: Preferences.getShowPRNumbers(),
        };
        this.onyxConnection = null;

        this.fetch = this.fetch.bind(this);
        this.toggleShowPRNumbers = this.toggleShowPRNumbers.bind(this);
    }

    componentDidMount() {
        this.fetch();

        this.onyxConnection = ReactNativeOnyx.connect({
            key: ONYXKEYS.PREFERENCES,
            callback: () => {
                this.setState({showPRNumbers: Preferences.getShowPRNumbers()});
            },
        });
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }

        if (!this.onyxConnection) {
            return;
        }
        ReactNativeOnyx.disconnect(this.onyxConnection);
    }

    toggleShowPRNumbers() {
        this.setState((prevState) => {
            const newValue = !prevState.showPRNumbers;
            Preferences.setShowPRNumbers(newValue);
            return {showPRNumbers: newValue};
        });
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

        return (
            <div className="panel your-pull-requests mb-3">
                <Title
                    text="Your Pull Requests"
                    count={_.size(this.props.prs) || 0}
                    onOpenAll={() => openAllUrls(this.props.prs)}
                    checkbox={{
                        id: 'shouldShowPRNumbers',
                        label: 'Show PR numbers',
                        isChecked: this.state.showPRNumbers,
                        onChange: this.toggleShowPRNumbers,
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
                            shouldShowNumber={this.state.showPRNumbers}
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
})(ListPRsAssigned);
