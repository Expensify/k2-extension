import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import Title from '../../component/panel-title/Title';
import ListItemPull from '../../component/list-item/ListItemPull';
import * as PullRequests from '../../lib/actions/PullRequests';
import {getReviewing} from '../../lib/actions/PullRequests';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** All the PRs assigned to the current user */
    prs: PropTypes.objectOf(IssuePropTypes),
};
const defaultProps = {
    prs: null,
};

class ListPRsReviewing extends React.Component {
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
        PullRequests.getReviewing();

        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    render() {
        console.log(this.props.prs);

        return (
            <div className="panel">
                <Title text="Review Requests - You need to finish reviewing" />

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

                {_.map(this.props.prs, pr => <ListItemPull key={pr.id} data={pr} />)}
            </div>
        );
    }
}

ListPRsReviewing.propTypes = propTypes;
ListPRsReviewing.defaultProps = defaultProps;

export default withOnyx({
    prs: {
        key: ONYXKEYS.PRS.REVIEWING,
    },
})(ListPRsReviewing);
