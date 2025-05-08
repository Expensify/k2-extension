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
    // Iteratee for sorting by owner (secondary sort, for unprioritized items)
    const ownerSortIteratee = (item) => {
        const priorityValue = priorities[item.url ?? ''] && (priorities[item.url].priority !== undefined)
            ? priorities[item.url].priority
            : Number.MAX_SAFE_INTEGER;
        if (priorityValue === Number.MAX_SAFE_INTEGER) {
            return item.currentUserIsOwner ? 0 : 1; // Sort unprioritized by owner
        }
        return 0; // Prioritized items get the same key here to maintain stability for the next sort
    };

    // Iteratee for sorting by priority (primary sort)
    const priorityIteratee = (item) => {
        const priorityValue = priorities[item.url ?? ''] && (priorities[item.url].priority !== undefined)
            ? priorities[item.url].priority
            : Number.MAX_SAFE_INTEGER;

        return priorityValue;
    };

    let sortedIssues = _.sortBy(preparedIssues, ownerSortIteratee);
    sortedIssues = _.sortBy(sortedIssues, priorityIteratee);

    // Use localOrder if available, while waiting for Onyx to update
    if (localOrder.length && localOrder.length === sortedIssues.length) {
        const dataById = _.indexBy(sortedIssues, 'id');
        return _.filter(_.map(localOrder, id => dataById[id]), Boolean);
    }

    return sortedIssues;
}

function PanelIssues(props) {
    const [priorities = {}] = useOnyx(`${ONYXKEYS.ISSUES.COLLECTION_PRIORITIES}${props.title}`);
    const [activeId, setActiveId] = useState(null);
    const prevPrioritiesRef = useRef();

    useEffect(() => {
        // Proof of Concept for Underscore/Lodash sortBy behavior
        // eslint-disable-next-line no-console
        console.log('--- sortBy Proof of Concept (runs once on mount) ---');
        const data = [
            {name: 'Alpha (V:0, G:0)', group: 0, value: 0}, // Criteria: [0,0]  -> String: "0,0"
            {name: 'Charlie (V:2, G:0)', group: 0, value: 2}, // Criteria: [2,0]  -> String: "2,0"
            {name: 'Bravo (V:2, G:1)', group: 1, value: 2}, // Criteria: [2,1]  -> String: "2,1"
            {name: 'Delta (V:10, G:0)', group: 0, value: 10}, // Criteria: [10,0] -> String: "10,0" - Problematic for lexicographical sort
        ];

        // eslint-disable-next-line no-console
        console.log('Data before sort:', JSON.parse(JSON.stringify(data)));

        const sortedByArray = _.sortBy(data, function(item) {
            // Primary sort: value, Secondary sort: group
            const criteria = [item.value, item.group];
            // Log for a few specific items to check criteria
            if (item.name === 'Delta (V:10, G:0)') {
                // eslint-disable-next-line no-console
                console.log(`Criteria array for Delta (V:10, G:0): [${criteria.join(',')}] Stringified: "${criteria.join(',')}"`);
            }
            if (item.name === 'Alpha (V:0, G:0)') {
                // eslint-disable-next-line no-console
                console.log(`Criteria array for Alpha (V:0, G:0): [${criteria.join(',')}] Stringified: "${criteria.join(',')}"`);
            }
            if (item.name === 'Charlie (V:2, G:0)') {
                // eslint-disable-next-line no-console
                console.log(`Criteria array for Charlie (V:2, G:0): [${criteria.join(',')}] Stringified: "${criteria.join(',')}"`);
            }
            return criteria;
        });

        // eslint-disable-next-line no-console
        console.log('\n--- Sorted by returning an array [value, group] (POTENTIALLY INCORRECT) ---');
        sortedByArray.forEach(function(item) {
            // eslint-disable-next-line no-console
            console.log(`Value: ${item.value}, Group: ${item.group}, Name: ${item.name} (Criteria string: "${item.value},${item.group}")`);
        });

        // eslint-disable-next-line no-console
        console.log('\n--- Explanation of Potential Incorrectness ---');
        // eslint-disable-next-line no-console
        console.log('1. Desired Multi-Criteria Sort (by value, then group):');
        // eslint-disable-next-line no-console
        console.log('   Expected order: Alpha (0,0) -> Charlie (2,0) -> Bravo (2,1) -> Delta (10,0)');
        // eslint-disable-next-line no-console
        console.log('\n2. INCORRECT String-Based Sort (Issue with _.sortBy and array return):');
        // eslint-disable-next-line no-console
        console.log("   _.sortBy may convert [value, group] to a string (e.g., [10,0] -> '10,0', [2,0] -> '2,0').");
        // eslint-disable-next-line no-console
        console.log("   Lexicographical comparison of these strings ('10,0' vs '2,0') causes '10,0' (Delta) to sort before '2,0' (Charlie).");
        // eslint-disable-next-line no-console
        console.log('   Actual order shown above for "Sorted by returning an array" demonstrates this: Delta (10,0) likely appears before Charlie (2,0) and Bravo (2,1).');

        const sortedByChaining = _.chain(data)
            .sortBy(function(item) { return item.group; }) // Sort by secondary key first (group)
            .sortBy(function(item) { return item.value; }) // Then sort by primary key (value)
            .value();

        // eslint-disable-next-line no-console
        console.log('\n--- Sorted by chaining sortBy (CORRECT METHOD) ---');
        sortedByChaining.forEach(function(item) {
            // eslint-disable-next-line no-console
            console.log(`Value: ${item.value}, Group: ${item.group}, Name: ${item.name}`);
        });
        // eslint-disable-next-line no-console
        console.log('Chained sort should produce the CORRECT order: Alpha (0,0) -> Charlie (2,0) -> Bravo (2,1) -> Delta (10,0)');
        // eslint-disable-next-line no-console
        console.log('--- End of sortBy Proof of Concept ---');
    }, []); // Empty dependency array means this runs once on mount

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

        // Update local order immediately for UI feedback
        const newOrder = arrayMove(_.pluck(filteredData, 'id'), oldIndex, newIndex);
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
