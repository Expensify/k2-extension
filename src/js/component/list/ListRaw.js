import React from 'react';
import _ from 'underscore';
import ListItemIssue from '../list-item/ListItemIssue';
import ListItemPull from '../list-item/ListItemPull';
import ListItemForm from '../list-item/ListItemForm';

const propTypes = {
    /** The type of data being displayed */
    type: React.PropTypes.oneOf(['issue', 'pull', 'review', 'form']).isRequired,

    /** The data that will be displayed */
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
};

const ListRaw = (props) => {
    if (!props.data.length) {
        return (
            <div className="blankslate capped clean-background">
                No items
            </div>
        );
    }

    return (
        <div>
            {_.map(props.data, (item) => {
                switch (props.type) {
                    case 'issue':
                        return <ListItemIssue key={`issue_raw_${item.id}`} data={item} />;
                    case 'pull':
                        return <ListItemPull key={`pull_raw_${item.id}`} data={item} />;
                    case 'review':
                        return <ListItemPull key={`review_raw_${item.id}`} data={item} />;
                    case 'form':
                        return <ListItemForm key={`form_raw_${item.id}`} data={item} />;
                    default: return null;
                }
            })}
        </div>
    );
};

ListRaw.propTypes = propTypes;
ListRaw.displayName = 'ListRaw';

export default ListRaw;
