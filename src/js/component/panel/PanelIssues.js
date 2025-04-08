import React, {useState} from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';
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

    /** If the issue is on HOLD, hide it */
    hideIfHeld: PropTypes.bool,

    /** If the issue is under review, hide it */
    hideIfUnderReview: PropTypes.bool,

    /** If the issue is owned by someone else, hide it */
    hideIfOwnedBySomeoneElse: PropTypes.bool,
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
    hideIfHeld: false,
    hideIfUnderReview: false,
    hideIfOwnedBySomeoneElse: false,
};

function PanelIssues(props) {
    const [issues, setIssues] = useState(Object.values(props.data));

    const onDragEnd = (result) => {
        const {destination, source} = result;

        // If no destination, or dropped in the same place, do nothing
        if (!destination || destination.index === source.index) {
            return;
        }

        const movedIssueID = filteredData[source.index].id;
        const destinationIssueID = filteredData[destination.index].id;

        // Find the source and destination indices in the issues array
        const sourceIndex = issues.findIndex(issue => issue.id === movedIssueID);
        const destinationIndex = issues.findIndex(issue => issue.id === destinationIssueID);

        // Reorder the issues array
        console.log(`Reordering issues: ${movedIssueID} from ${sourceIndex} to ${destinationIndex}`);
        console.log(`Issues before reordering: ${JSON.stringify(issues)}`);
        const reorderedIssues = Array.from(issues);
        const [removed] = reorderedIssues.splice(sourceIndex, 1);
        reorderedIssues.splice(destinationIndex, 0, removed);
        console.log(`Issues after reordering: ${JSON.stringify(reorderedIssues)}`);
        setIssues(reorderedIssues);
    };

    let filteredData = issues;

    if (props.hideIfHeld || props.hideIfUnderReview || props.hideIfOwnedBySomeoneElse) {
        filteredData = _.filter(issues, (item) => {
            const isHeld = item.title.toLowerCase().indexOf('[hold') > -1 ? ' hold' : '';
            const isUnderReview = _.find(item.labels, label => label.name.toLowerCase() === 'reviewing');
            const isOwnedBySomeoneElse = item.issueHasOwner && !item.currentUserIsOwner;

            if (isHeld && props.hideIfHeld) {
                return false;
            }

            if (isUnderReview && props.hideIfUnderReview) {
                return false;
            }

            if (isOwnedBySomeoneElse && props.hideIfOwnedBySomeoneElse) {
                return false;
            }

            return true;
        });
    }

    if (props.applyFilters && props.filters && !_.isEmpty(props.filters)) {
        filteredData = _.filter(issues, (item) => {
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

    if (!_.size(filteredData) && props.hideOnEmpty) {
        return null;
    }

    return (
        <div className={`panel ${props.extraClass}`}>
            <Title
                text={props.title}
                count={_.size(filteredData) || 0}
            />

            {!_.size(filteredData) ? (
                <div className="blankslate capped clean-background">
                    No items
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="issues-list">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {filteredData.map((issue, index) => (
                                    <Draggable key={issue.id} draggableId={issue.id.toString()} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                <ListItemIssue issue={issue} />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}
        </div>
    );
}

PanelIssues.propTypes = propTypes;
PanelIssues.defaultProps = defaultProps;
PanelIssues.displayName = 'PanelIssues';

export default withOnyx({
    filters: {
        key: ONYXKEYS.ISSUES.FILTER,
    },
})(PanelIssues);