import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import React, {
    useMemo, useState, useEffect, useCallback,
} from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
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

function getOrderedFilteredIssues({
    issues,
    filters = {},
    priorities = {},
    localOrder = [],
    hideIfHeld = false,
    hideIfUnderReview = false,
    hideIfOwnedBySomeoneElse = false,
    applyFilters = false,
}) {
    let preparedIssues = issues;
    if (!preparedIssues) {
        return [];
    }

    // Hide by hold, review, owner
    if (hideIfHeld || hideIfUnderReview || hideIfOwnedBySomeoneElse) {
        preparedIssues = _.filter(preparedIssues, (item) => {
            const isHeld = item.title.toLowerCase().indexOf('[hold') > -1 ? ' hold' : '';
            const isUnderReview = _.find(item.labels, label => label.name.toLowerCase() === 'reviewing');
            const isOwnedBySomeoneElse = item.issueHasOwner && !item.currentUserIsOwner;
            if (isHeld && hideIfHeld) {
                return false;
            }
            if (isUnderReview && hideIfUnderReview) {
                return false;
            }
            if (isOwnedBySomeoneElse && hideIfOwnedBySomeoneElse) {
                return false;
            }
            return true;
        });
    }

    // Apply filters
    if (applyFilters && filters && !_.isEmpty(filters)) {
        preparedIssues = _.filter(preparedIssues, (item) => {
            const isImprovement = _.findWhere(item.labels, {name: 'Improvement'});
            const isTask = _.findWhere(item.labels, {name: 'Task'});
            const isFeature = _.findWhere(item.labels, {name: 'NewFeature'});
            const isOnMilestone = item.milestone && item.milestone.id === filters.milestone;

            // If we are filtering on milestone, remove everything not on that milestone
            if (filters.milestone && !isOnMilestone) {
                return false;
            }
            return (filters.improvement && isImprovement)
                || (filters.task && isTask)
                || (filters.feature && isFeature);
        });
    }

    // Sort by priority, then owner
    preparedIssues = _.sortBy(preparedIssues, (item) => {
        const priority = priorities[item.url ?? ''] && (priorities[item.url].priority !== undefined)
            ? priorities[item.url].priority
            : Number.MAX_SAFE_INTEGER;
        return [priority, item.currentUserIsOwner ? 0 : 1];
    });

    // Use localOrder if available
    if (localOrder.length === preparedIssues.length) {
        const dataById = _.indexBy(preparedIssues, 'id');
        return _.filter(_.map(localOrder, id => dataById[id]), Boolean);
    }
    return preparedIssues;
}

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
            {...attributes} // eslint-disable-line react/jsx-props-no-spreading
            {...listeners} // eslint-disable-line react/jsx-props-no-spreading
        >
            <ListItemIssue issue={issue} />
        </div>
    );
}
SortableIssue.propTypes = {
    issue: IssuePropTypes.isRequired,
};

function PanelIssues(props) {
    const [priorities = {}] = useOnyx(`${ONYXKEYS.ISSUES.COLLECTION_PRIORITIES}${props.title}`);
    const [activeId, setActiveId] = useState(null);

    // Add local state for ordered issues so that it can be updated synchronously when the user drags an issue and drops it,
    // preventing the item from jumping back to its original position briefly
    const [localOrder, setLocalOrder] = useState([]);

    const filteredData = useMemo(() => getOrderedFilteredIssues({
        issues: props.data,
        filters: props.filters,
        priorities,
        localOrder,
        hideIfHeld: props.hideIfHeld,
        hideIfUnderReview: props.hideIfUnderReview,
        hideIfOwnedBySomeoneElse: props.hideIfOwnedBySomeoneElse,
        applyFilters: props.applyFilters,
    }), [
        props.data,
        props.hideIfHeld,
        props.hideIfUnderReview,
        props.hideIfOwnedBySomeoneElse,
        props.applyFilters,
        props.filters,
        priorities,
        localOrder,
    ]);

    useEffect(() => {
        const sortedIDs = _.map(filteredData, item => item.id);
        console.log('sortedIDs', sortedIDs);
        if (!sortedIDs.length || _.isEqual(localOrder, sortedIDs)) {
            return;
        }
        setLocalOrder(sortedIDs);
    }, [filteredData, localOrder]);

    useEffect(() => {
        if (!filteredData.length || (localOrder.length === filteredData.length && _.isEqual(_.pluck(filteredData, 'id'), localOrder))) {
            return;
        }

        // Reset localOrder if data changes (e.g., after Onyx update)
        setLocalOrder(_.pluck(filteredData, 'id'));
    }, [filteredData, localOrder]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
    );

    const issueIds = _.map(filteredData, issue => issue.id.toString());
    const activeIssue = activeId ? _.find(filteredData, issue => issue.id.toString() === activeId) : null;

    const handleDragStart = useCallback((event) => {
        setActiveId(event.active.id);
    }, [setActiveId]);

    const handleDragEnd = useCallback((event) => {
        const active = event.active;
        const over = event.over;
        setActiveId(null);
        if (!over || active.id === over.id) {
            return;
        }
        const oldIndex = issueIds.indexOf(active.id);
        const newIndex = issueIds.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Update local order immediately
        const newOrder = arrayMove(localOrder, oldIndex, newIndex);
        setLocalOrder(newOrder);

        // Also update priorities in Onyx
        const reorderedData = arrayMove(filteredData, oldIndex, newIndex);
        const newPriorities = {};
        for (let i = 0; i < reorderedData.length; i++) {
            const issue = reorderedData[i];
            newPriorities[issue.url] = {
                priority: i,
            };
        }
        Issues.setPriorities(newPriorities, props.title);
    }, [setActiveId, issueIds, localOrder, filteredData, props.title]);

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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={issueIds}
                        strategy={verticalListSortingStrategy}
                    >
                        {_.map(filteredData, issue => <SortableIssue key={issue.id} issue={issue} />)}
                    </SortableContext>
                    <DragOverlay>
                        {activeIssue ? (
                            <div style={{
                                lineHeight: 1.2,
                                background: '#fff',
                                opacity: 1,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            }}
                            >
                                <ListItemIssue issue={activeIssue} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
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
