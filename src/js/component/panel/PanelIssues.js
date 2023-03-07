import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import Title from '../panel-title/Title';
import IssuePropTypes from '../list-item/IssuePropTypes';
import ListItemIssue from '../list-item/ListItemIssue';
import ONYXKEYS from '../../ONYXKEYS';
import filterPropTypes from '../../lib/filterPropTypes';

const propTypes = {
    /** A CSS class to add to this panel to give it some color */
    extraClass: PropTypes.string.isRequired,

    /** The title of the panel */
    title: PropTypes.string.isRequired,

    /** The data that will be displayed in the list */
    data: PropTypes.objectOf(IssuePropTypes).isRequired,

    /** For the views at the top of the dashboard, we need to ignore the milestone/ksv2 filters */
    applyFilters: PropTypes.bool,

    /** The filters to apply to the issue data */
    filters: filterPropTypes,

    /** If there are no issues to list in the panel, hide the panel entirely */
    hideOnEmpty: PropTypes.bool,
};
const defaultProps = {
    filters: {
        improvement: true,
        task: true,
        feature: true,
        milestone: '',
    },
    applyFilters: false,
    hideOnEmpty: false,
};

const PanelIssues = (props) => {
    let filteredData = props.data;

    // We need to be sure to filter the data if the user has set any filters
    if (props.applyFilters && props.filters && !_.isEmpty(props.filters)) {
        filteredData = _.filter(props.data, (item) => {
            const isImprovement = _.findWhere(item.labels, {name: 'Improvement'});
            const isTask = _.findWhere(item.labels, {name: 'Task'});
            const isFeature = _.findWhere(item.labels, {name: 'NewFeature'});
            const isOnMilestone = item.milestone && item.milestone.id === props.filters.milestone;

            // If we are filtering on milestone, remove everything not on that milestone
            if (props.filters.milestone && !isOnMilestone) {
                return false;
            }

            return (props.filters.improvement && isImprovement)
                || (props.filters.task && isTask)
                || (props.filters.feature && isFeature);
        });
    }

    if (!_.size(props.data) && props.hideOnEmpty) {
        return null;
    }

    return (
        <div className={`panel ${props.extraClass}`}>
            <Title
                text={props.title}
                count={_.size(filteredData) || 0}
            />

            {!_.size(props.data) ? (
                <div className="blankslate capped clean-background">
                    No items
                </div>
            ) : (
                <div>
                    {_.map(filteredData, issue => <ListItemIssue key={`issue_raw_${issue.id}`} issue={issue} />)}
                </div>
            )}
        </div>
    );
};

PanelIssues.propTypes = propTypes;
PanelIssues.defaultProps = defaultProps;
PanelIssues.displayName = 'PanelIssues';

export default withOnyx({
    filters: {
        key: ONYXKEYS.ISSUES.FILTER,
    },
})(PanelIssues);
