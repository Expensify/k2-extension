import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import * as Issues from '../../lib/actions/Issues';
import ONYXKEYS from '../../ONYXKEYS';
import PanelListRaw from '../../component/panel/PanelListRaw';
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

class ListIssuesEngineering extends React.Component {
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
        Issues.getEngineering();

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
                    No engineering issues
                </div>
            );
        }

        return (
            <PanelListRaw
                title="Engineering"
                extraClass="none"
                item="issue"
                data={this.props.issues}
            />
        );
    }
}

ListIssuesEngineering.propTypes = propTypes;
ListIssuesEngineering.defaultProps = defaultProps;

export default withOnyx({
    issues: {
        key: ONYXKEYS.ISSUES.ENGINEERING,
    },
})(ListIssuesEngineering);
