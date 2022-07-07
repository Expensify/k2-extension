import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import Title from '../panel-title/Title';
import IssuePropTypes from '../list-item/IssuePropTypes';
import ListItemIssue from '../list-item/ListItemIssue';

const propTypes = {
    /** A CSS class to add to this panel to give it some color */
    extraClass: PropTypes.string.isRequired,

    /** The title of the panel */
    title: PropTypes.string.isRequired,

    /** The data that will be displayed in the list */
    data: PropTypes.objectOf(IssuePropTypes).isRequired,
};

const PanelIssues = props => (
    <div className={`panel ${props.extraClass}`}>
        <Title text={props.title} />

        {!_.size(props.data) ? (
            <div className="blankslate capped clean-background">
                No items
            </div>
        ) : (
            <div>
                {_.map(props.data, item => <ListItemIssue key={`issue_raw_${item.id}`} data={item} />)}
            </div>
        )}
    </div>
);

PanelIssues.propTypes = propTypes;
PanelIssues.displayName = 'PanelIssues';

export default PanelIssues;
