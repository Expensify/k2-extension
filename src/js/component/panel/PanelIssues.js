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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import React, {
    useMemo, useState, useEffect, useCallback, useRef,
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
import SortableIssue from '../list-item/SortableIssue';

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
    // Build lookup tables for logging
    const issuesArray = _.isArray(issues) ? issues : _.values(issues);
    const idToTitle = _.object(_.map(issuesArray, issue => [issue.id, issue.title]));
    const urlToTitle = _.object(_.map(issuesArray, issue => [issue.url, issue.title]));

    // Log priorities as ordered list of titles
    const orderedUrls = _.chain(priorities)
        .map((v, url) => ({url, priority: v.priority}))
        .sortBy('priority')
        .map(({url}) => url)
        .value();
    const prioritiesTitles = _.map(orderedUrls, url => urlToTitle[url] || url);
    // eslint-disable-next-line no-console
    console.log('[getOrderedFilteredIssues] priorities (ordered titles):', prioritiesTitles);

    // Log localOrder as list of titles
    const localOrderTitles = _.map(localOrder, id => idToTitle[id] || id);
    // eslint-disable-next-line no-console
    console.log('[getOrderedFilteredIssues] localOrder (titles):', localOrderTitles);

    let preparedIssues = issues;
    if (!preparedIssues) {
        return [];
    }

    // Hide by hold, review, owner
    if (hideIfHeld || hideIfUnderReview || hideIfOwnedBySomeoneElse) {
        console.log('[getOrderedFilteredIssues] hiding issues based on hold, review, or owner');
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
        console.log('[getOrderedFilteredIssues] applying filters');
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

    // Check for missing priorities
    const missingPriorityTitles = _.map(
        _.filter(preparedIssues, issue => !priorities[issue.url] || priorities[issue.url].priority === undefined),
        issue => issue.title,
    );
    if (missingPriorityTitles.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('[getOrderedFilteredIssues] Issues missing priorities:', missingPriorityTitles);
    }

    // Check for non-unique priorities
    const priorityValues = _.map(preparedIssues, issue => priorities[issue.url] && priorities[issue.url].priority);
    const duplicatePriorities = _.keys(_.pick(_.countBy(priorityValues), count => count > 1 && count !== undefined));
    if (duplicatePriorities.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('[getOrderedFilteredIssues] Duplicate priority values found:', duplicatePriorities);
    }

    // Sort by priority, then owner
    console.log('[getOrderedFilteredIssues] preparedIssues before priority sort:', preparedIssues);
    console.log('[getOrderedFilteredIssues] priorities for priority sort:', priorities);

    const issuesToSort = _.isArray(preparedIssues) ? preparedIssues : _.values(preparedIssues);

    // Iteratee for sorting by owner (secondary sort, for unprioritized items)
    const ownerSortIteratee = (item) => {
        const priorityValue = priorities[item.url ?? ''] && (priorities[item.url].priority !== undefined)
            ? priorities[item.url].priority
            : Number.MAX_SAFE_INTEGER;
        const hasActualPriority = priorityValue !== Number.MAX_SAFE_INTEGER;

        if (!hasActualPriority) {
            return item.currentUserIsOwner ? 0 : 1; // Sort unprioritized by owner
        }
        return 0; // Prioritized items get the same key here to maintain stability for the next sort
    };

    // Iteratee for sorting by priority (primary sort)
    const priorityIteratee = (item) => {
        const priorityValue = priorities[item.url ?? ''] && (priorities[item.url].priority !== undefined)
            ? priorities[item.url].priority
            : Number.MAX_SAFE_INTEGER;

        // Log if defaulting
        if (priorityValue === Number.MAX_SAFE_INTEGER) {
            console.log('[getOrderedFilteredIssues] issue missing priority in primary sort:', item.title);
        }
        return priorityValue;
    };

    let sortedIssues = _.sortBy(issuesToSort, ownerSortIteratee);
    sortedIssues = _.sortBy(sortedIssues, priorityIteratee);

    console.log('[getOrderedFilteredIssues] preparedIssues after priority sort:', sortedIssues);

    // Use localOrder if available, while waiting for Onyx to update
    if (localOrder.length && localOrder.length === sortedIssues.length) {
        const dataById = _.indexBy(sortedIssues, 'id');
        // eslint-disable-next-line no-console
        console.log('[getOrderedFilteredIssues] Using localOrder for ordering');
        return _.filter(_.map(localOrder, id => dataById[id]), Boolean);
    }

    // Fallback
    // eslint-disable-next-line no-console
    console.log('[getOrderedFilteredIssues] Using fallback sort (priority, owner)');
    return sortedIssues;
}

function PanelIssues(props) {
    const [priorities = {}] = useOnyx(`${ONYXKEYS.ISSUES.COLLECTION_PRIORITIES}${props.title}`);
    const [activeId, setActiveId] = useState(null);
    const prevPrioritiesRef = useRef();

    // Add local state for ordered issues so that it can be updated synchronously when the user drags an issue and drops it,
    // preventing the item from jumping back to its original position briefly
    const [localOrder, setLocalOrder] = useState([]);

    // When priorities or filteredData change (i.e., Onyx updates), clear localOrder only if it's set
    useEffect(() => {
        if (!localOrder.length) {
            return;
        }

        // If priorities have changed since the last render, it means Onyx has updated.
        // We can now clear localOrder as the persisted order should be reflected.
        if (!_.isEqual(prevPrioritiesRef.current, priorities)) {
            setLocalOrder([]);
        }

        // Update the ref to the current priorities for the next render.
        prevPrioritiesRef.current = priorities;
    }, [priorities, localOrder]);

    // Debug: Log whenever priorities is updated from Onyx
    useEffect(() => {
        // Build an ordered array of issue titles based on priorities
        const issuesArray = _.isArray(props.data) ? props.data : _.values(props.data);
        const urlToTitle = _.object(_.map(issuesArray, issue => [issue.url, issue.title]));
        const orderedUrls = _.chain(priorities)
            .map((v, url) => ({url, priority: v.priority}))
            .sortBy('priority')
            .map(({url}) => url)
            .value();
        const orderedTitles = _.map(orderedUrls, url => urlToTitle[url] || url);
        // eslint-disable-next-line no-console
        console.log('[PanelIssues] priorities updated from Onyx (ordered titles):', orderedTitles);
    }, [priorities, props.data]);

    const filteredData = useMemo(() => {
        const result = getOrderedFilteredIssues({
            issues: props.data,
            filters: props.filters,
            priorities,
            localOrder,
            hideIfHeld: props.hideIfHeld,
            hideIfUnderReview: props.hideIfUnderReview,
            hideIfOwnedBySomeoneElse: props.hideIfOwnedBySomeoneElse,
            applyFilters: props.applyFilters,
        });
        // eslint-disable-next-line no-console
        console.log('[PanelIssues] getOrderedFilteredIssues result:', _.map(result, issue => issue.title));
        return result;
    }, [
        props.data,
        props.hideIfHeld,
        props.hideIfUnderReview,
        props.hideIfOwnedBySomeoneElse,
        props.applyFilters,
        props.filters,
        priorities,
        localOrder,
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
    );

    const issueIds = _.map(filteredData, issue => issue.id.toString());
    const activeIssue = activeId ? _.find(filteredData, issue => issue.id.toString() === activeId) : null;

    const updatePriorities = useCallback((event) => {
        // In dnd-kit, `event.active` represents the item being dragged, and `event.over` represents the item currently being hovered over (the potential drop target).
        const active = event.active;
        const over = event.over;
        setActiveId(null);

        // Early return: If there is no item being hovered over (e.g., dropped outside a valid target), or if the dragged item is dropped back in its original position.
        if (!over || active.id === over.id) {
            return;
        }

        // Early return: If either the dragged or target item is not found in the list.
        const oldIndex = issueIds.indexOf(active.id);
        const newIndex = issueIds.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Log the order of issue titles before reordering
        // eslint-disable-next-line no-console
        console.log('[PanelIssues] Order before reorder:', _.map(filteredData, issue => issue.title));

        // Update local order immediately for UI feedback
        const newOrder = arrayMove(_.pluck(filteredData, 'id'), oldIndex, newIndex);
        setLocalOrder(newOrder);

        // Log the order of issue titles after reordering
        const reorderedData = arrayMove(filteredData, oldIndex, newIndex);
        // eslint-disable-next-line no-console
        console.log('[PanelIssues] Order after reorder:', _.map(reorderedData, issue => issue.title));

        // Also update priorities in Onyx
        const newPriorities = {};
        for (let i = 0; i < reorderedData.length; i++) {
            const issue = reorderedData[i];
            newPriorities[issue.url] = {
                priority: i,
            };
        }
        Issues.setPriorities(newPriorities, props.title);
    }, [setActiveId, issueIds, filteredData, props.title]);

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
                    onDragStart={e => setActiveId(e.active.id)}
                    onDragEnd={updatePriorities}
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
