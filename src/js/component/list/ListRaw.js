import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import ListItemIssue from '../list-item/ListItemIssue';
import IssuePropTypes from '../list-item/IssuePropTypes';

const propTypes = {
    /** The data that will be displayed */
    data: PropTypes.objectOf(IssuePropTypes).isRequired,
};

const ListRaw = (props) => {
    if (!_.size(props.data)) {
        return (
            <div className="blankslate capped clean-background">
                No items
            </div>
        );
    }

    return (
        <div>
            {_.map(props.data, (item) => (<ListItemIssue key={`issue_raw_${item.id}`} data={item} />))}
        </div>
    );
};

ListRaw.propTypes = propTypes;
ListRaw.displayName = 'ListRaw';

export default ListRaw;
