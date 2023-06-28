import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';
import Title from '../../component/panel-title/Title';
import ListItemPull from '../../component/list-item/ListItemPull';
import * as PullRequests from '../../lib/actions/PullRequests';
import filterPropTypes from '../../lib/filterPropTypes';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** All the PRs assigned to the current user */
    prs: PropTypes.objectOf(IssuePropTypes),

    /** The filters to apply to the GH issues */
    filters: filterPropTypes,
};
const defaultProps = {
    prs: null,
    filters: {},
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

    filterPR(prs) {
        let filteredPRs = _.chain(prs)
            .sortBy('updatedAt')
            .value()
            .reverse();

        if (this.props.filters.hideHold) {
            filteredPRs = _.filter(prs, (pr) => {
                const regExp = /^\[.*Hold.*\]/ig;
                return !regExp.exec(pr.title);
            });
        }

        if (this.props.filters.hideCPlusReviewed) {
            filteredPRs = _.filter(filteredPRs, pr => !pr.isCPlusApproved);
        }

        if (this.props.filters.pushCPlusDown) {
            filteredPRs = _.sortBy(filteredPRs, pr => (pr.isCPlusApproved ? 1 : 0));
        }

        return filteredPRs;
    }

    render() {
        const prs = this.filterPR(this.props.prs);
        if (prs && !_.size(prs)) {
            return null;
        }

        return (
            <div className="panel mb-3 daily">
                <Title
                    text="Review these PRs Daily"
                    count={_.size(prs) || 0}
                />

                {!this.props.prs && (
                    <div className="blankslate capped clean-background">
                        Loading
                    </div>
                )}

                {_.map(prs, pr => <ListItemPull key={pr.id} pr={pr} />)}
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
    filters: {
        key: ONYXKEYS.ISSUES.FILTER,
    },
})(ListPRsReviewing);
