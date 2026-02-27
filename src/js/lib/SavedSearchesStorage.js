import getBrowser from './browser';

const STORAGE_KEY = 'k2_saved_searches';

/**
 * @returns {Promise<Array<{id: string, name: string, filters: Object, createdAt: number}>>}
 */
function getSavedSearches() {
    const browser = getBrowser();
    return new Promise((resolve) => {
        browser.storage.local.get(STORAGE_KEY, (result) => {
            const list = result && result[STORAGE_KEY];
            resolve(Array.isArray(list) ? list : []);
        });
    });
}

/**
 * @param {Array<{id: string, name: string, filters: Object, createdAt: number}>} list
 * @returns {Promise<void>}
 */
function setSavedSearches(list) {
    const browser = getBrowser();
    return new Promise((resolve) => {
        browser.storage.local.set({[STORAGE_KEY]: list}, resolve);
    });
}

export {
    getSavedSearches,
    setSavedSearches,
};
