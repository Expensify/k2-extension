import ReactNativeOnyx from 'react-native-onyx';
import _ from 'underscore';
import ONYXKEYS from '../../ONYXKEYS';
import * as Issues from './Issues';
import {getSavedSearches as getSavedSearchesFromStorage, setSavedSearches} from '../SavedSearchesStorage';

/**
 * Load saved searches from extension storage into Onyx for UI
 * @returns {Promise<Array>}
 */
function getSavedSearches() {
    return getSavedSearchesFromStorage().then((list) => {
        ReactNativeOnyx.set(ONYXKEYS.SAVED_SEARCHES, list);
        return list;
    });
}

/**
 * Save the current filter state as a named saved search
 * @param {string} name - Display name for the saved search
 * @param {Object} filters - Current filter state (e.g. from ONYXKEYS.ISSUES.FILTER)
 */
function saveSavedSearch(name, filters) {
    const trimmedName = (name || '').trim();
    if (!trimmedName) {
        return Promise.resolve();
    }

    const saved = {
        id: `saved-search-${Date.now()}`,
        name: trimmedName,
        filters: _.clone(filters || {}),
        createdAt: Date.now(),
    };

    return getSavedSearchesFromStorage().then((list) => {
        const next = [...list, saved];
        return setSavedSearches(next).then(() => {
            ReactNativeOnyx.set(ONYXKEYS.SAVED_SEARCHES, next);
        });
    });
}

/**
 * Apply a saved search by id (sets Onyx ISSUES.FILTER to the saved filters)
 * @param {string} id
 * @returns {Promise<void>} Resolves after filters have been applied (waits for saveFilters if it returns a promise)
 */
function applySavedSearch(id) {
    return getSavedSearchesFromStorage().then((list) => {
        const found = _.findWhere(list, {id});
        if (!found || !found.filters) {
            return Promise.resolve();
        }
        const result = Issues.saveFilters(found.filters);
        return (result && typeof result.then === 'function') ? result : Promise.resolve();
    });
}

/**
 * Remove a saved search by id
 * @param {string} id
 */
function deleteSavedSearch(id) {
    return getSavedSearchesFromStorage().then((list) => {
        const next = _.reject(list, item => item.id === id);
        return setSavedSearches(next).then(() => {
            ReactNativeOnyx.set(ONYXKEYS.SAVED_SEARCHES, next);
        });
    });
}

/**
 * Rename a saved search
 * @param {string} id
 * @param {string} newName
 */
function renameSavedSearch(id, newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed) {
        return Promise.resolve();
    }

    return getSavedSearchesFromStorage().then((list) => {
        const next = _.map(list, (item) => (
            item.id === id ? {...item, name: trimmed} : item
        ));
        return setSavedSearches(next).then(() => {
            ReactNativeOnyx.set(ONYXKEYS.SAVED_SEARCHES, next);
        });
    });
}

export {
    getSavedSearches,
    saveSavedSearch,
    applySavedSearch,
    deleteSavedSearch,
    renameSavedSearch,
};
