import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import ListItemIssue from './ListItemIssue';
import IssuePropTypes from './IssuePropTypes';

const propTypes = {
    /** The issue to display */
    issue: IssuePropTypes.isRequired,
};

function SortableIssue(props) {
    const {issue} = props;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: issue.id.toString()});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1,
        background: isDragging ? '#f0f0f0' : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}

            // eslint-disable-next-line react/jsx-props-no-spreading -- Spreading is required for dnd-kit drag-and-drop attributes
            {...attributes}

            // eslint-disable-next-line react/jsx-props-no-spreading -- Spreading is required for dnd-kit drag-and-drop listeners
            {...listeners}
        >
            <ListItemIssue issue={issue} />
        </div>
    );
}

SortableIssue.propTypes = propTypes;
SortableIssue.displayName = 'SortableIssue';

export default SortableIssue;
