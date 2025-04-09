import React, {useMemo} from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';
import {withOnyx, useOnyx} from 'react-native-onyx';
import Title from '../panel-title/Title';
import IssuePropTypes from '../list-item/IssuePropTypes';
import ListItemIssue from '../list-item/ListItemIssue';
import ONYXKEYS from '../../ONYXKEYS';
import filterPropTypes from '../../lib/filterPropTypes';
import * as Issues from '../../lib/actions/Issues';

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
    const [priorities = {}] = useOnyx(`${ONYXKEYS.ISSUES.COLLECTION_PRIORITIES}${props.title}`);

    // Compute filteredData dynamically using useMemo
    const filteredData = useMemo(() => {
        let data = props.data;

        if (props.hideIfHeld || props.hideIfUnderReview || props.hideIfOwnedBySomeoneElse) {
            data = _.filter(data, (item) => {
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

        // We need to be sure to filter the data if the user has set any filters
        if (props.applyFilters && props.filters && !_.isEmpty(props.filters)) {
            data = _.filter(data, (item) => {
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

        // Sort the filtered data by priority, then currentUserIsOwner
        data = _.sortBy(data, (item) => {
            // If the issue has a priority, use it; otherwise, assign a very high value to sort it last
            const priority = priorities[item.url ?? ''] && (priorities[item.url].priority !== undefined) ? priorities[item.url].priority : Number.MAX_SAFE_INTEGER;

            // Sort by priority first, then by currentUserIsOwner
            return [priority, item.currentUserIsOwner ? 0 : 1];
        });
        return data;
    }, [
        props.data,
        props.hideIfHeld,
        props.hideIfUnderReview,
        props.hideIfOwnedBySomeoneElse,
        props.applyFilters,
        props.filters,
        priorities,
    ]);

    const onDragEnd = (result) => {
        const {destination, source} = result;

        // If no destination, or dropped in the same place, do nothing
        if (!destination || destination.index === source.index) {
            return;
        }

        // Reorder the filteredData array
        const reorderedData = Array.from(filteredData);
        const [removed] = reorderedData.splice(source.index, 1);
        reorderedData.splice(destination.index, 0, removed);

        // Create an object mapping issues URLs to their priorities
        const newPriorities = {};
        for (let i = 0; i < reorderedData.length; i++) {
            const issue = reorderedData[i];
            newPriorities[issue.url] = {
                priority: i,
            };
        }
        Issues.setPriorities(newPriorities, props.title);
    };

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
                        {provided => (
                            <div
                                // eslint-disable-next-line react/jsx-props-no-spreading
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {_.map(filteredData, (issue, index) => (
                                    <Draggable key={issue.id} draggableId={issue.id.toString()} index={index}>
                                        {draggableProvided => (
                                            <div
                                                ref={draggableProvided.innerRef}
                                                // eslint-disable-next-line react/jsx-props-no-spreading
                                                {...draggableProvided.draggableProps}
                                                // eslint-disable-next-line react/jsx-props-no-spreading
                                                {...draggableProvided.dragHandleProps}
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
