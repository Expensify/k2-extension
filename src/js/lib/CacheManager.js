/* global chrome */
import _ from 'underscore';

/**
 * CacheManager - Handles caching of API responses with ETag support and persistent storage.
 *
 * Features:
 * - ETag-based conditional requests (304 responses don't count against rate limits)
 * - Response body caching with configurable TTL
 * - Persistent storage via chrome.storage.local
 * - In-memory cache for fast access
 */

const CACHE_STORAGE_KEY = 'k2_api_cache';
const DEFAULT_TTL_MS = 60000; // 1 minute default TTL

// In-memory cache for fast access (synced with chrome.storage)
let memoryCache = {};

// Track if we've loaded from storage yet
let initialized = false;

/**
 * Save the current cache to chrome.storage
 * @returns {Promise}
 */
async function persistCache() {
    try {
        await chrome.storage.local.set({[CACHE_STORAGE_KEY]: memoryCache});
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('CacheManager: Failed to persist cache', error);
    }
}

/**
 * Clean up expired cache entries
 */
function cleanExpiredEntries() {
    const now = Date.now();
    let hasExpired = false;

    _.each(_.keys(memoryCache), (key) => {
        const entry = memoryCache[key];
        if (entry.expiresAt && entry.expiresAt < now) {
            delete memoryCache[key];
            hasExpired = true;
        }
    });

    if (hasExpired) {
        persistCache();
    }
}

/**
 * Initialize the cache by loading from chrome.storage
 * @returns {Promise}
 */
async function init() {
    if (initialized) {
        return;
    }

    try {
        const result = await chrome.storage.local.get(CACHE_STORAGE_KEY);
        if (result[CACHE_STORAGE_KEY]) {
            memoryCache = result[CACHE_STORAGE_KEY];
            cleanExpiredEntries();
        }
        initialized = true;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(
            'CacheManager: chrome.storage not available, using memory-only cache',
        );
        initialized = true;
    }
}

/**
 * Get a cached response if it exists and is not expired
 * @param {String} cacheKey - Unique key for the cached item
 * @returns {Object|null} - Cached data or null if not found/expired
 */
async function get(cacheKey) {
    await init();

    const entry = memoryCache[cacheKey];
    if (!entry) {
        return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
        delete memoryCache[cacheKey];
        return null;
    }

    return entry;
}

/**
 * Store a response in the cache
 * @param {String} cacheKey - Unique key for the cached item
 * @param {*} data - Response data to cache
 * @param {String} [etag] - ETag header value for conditional requests
 * @param {Number} [ttlMs] - Time-to-live in milliseconds
 * @returns {Promise}
 */
async function set(cacheKey, data, etag = null, ttlMs = DEFAULT_TTL_MS) {
    await init();

    memoryCache[cacheKey] = {
        data,
        etag,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlMs,
    };

    // Persist asynchronously (don't block)
    persistCache();
}

/**
 * Get the ETag for a cached item (for conditional requests)
 * @param {String} cacheKey - Unique key for the cached item
 * @returns {String|null} - ETag value or null
 */
async function getEtag(cacheKey) {
    const entry = await get(cacheKey);
    return (entry && entry.etag) || null;
}

/**
 * Invalidate a specific cache entry
 * @param {String} cacheKey - Key to invalidate
 * @returns {Promise}
 */
async function invalidate(cacheKey) {
    await init();

    if (memoryCache[cacheKey]) {
        delete memoryCache[cacheKey];
        persistCache();
    }
}

/**
 * Invalidate all cache entries matching a pattern
 * @param {String} pattern - Pattern to match (supports * wildcard at end)
 * @returns {Promise}
 */
async function invalidatePattern(pattern) {
    await init();

    const isPrefix = pattern.endsWith('*');
    const prefix = isPrefix ? pattern.slice(0, -1) : pattern;

    let hasChanges = false;
    _.each(_.keys(memoryCache), (key) => {
        const matches = isPrefix ? key.startsWith(prefix) : key === pattern;
        if (!matches) {
            return;
        }
        delete memoryCache[key];
        hasChanges = true;
    });

    if (!hasChanges) {
        return;
    }

    persistCache();
}

/**
 * Clear all cached data
 * @returns {Promise}
 */
async function clear() {
    memoryCache = {};
    try {
        await chrome.storage.local.remove(CACHE_STORAGE_KEY);
    } catch (error) {
        // Silently fail if storage is not available
    }
}

/**
 * Generate a cache key for REST API calls
 * @param {String} method - HTTP method
 * @param {String} endpoint - API endpoint
 * @param {Object} [params] - Request parameters
 * @returns {String}
 */
function generateRestCacheKey(method, endpoint, params = {}) {
    const paramStr = _.map(
        _.keys(params).sort(),
        k => `${k}=${params[k]}`,
    ).join('&');
    return `rest:${method}:${endpoint}${paramStr ? `:${paramStr}` : ''}`;
}

/**
 * Generate a cache key for GraphQL queries
 * @param {String} queryHash - Hash or identifier for the query
 * @param {Object} [variables] - Query variables
 * @returns {String}
 */
function generateGraphQLCacheKey(queryHash, variables = {}) {
    const varsStr = JSON.stringify(variables);
    return `graphql:${queryHash}:${varsStr}`;
}

// TTL presets for different types of data
const TTL = {
    SHORT: 60000, // 1 minute - for frequently changing data
    MEDIUM: 120000, // 2 minutes - for moderately changing data
    LONG: 300000, // 5 minutes - for rarely changing data (milestones)
    VERY_LONG: 600000, // 10 minutes - for very stable data
};

export {
    init,
    get,
    set,
    getEtag,
    invalidate,
    invalidatePattern,
    clear,
    generateRestCacheKey,
    generateGraphQLCacheKey,
    TTL,
};
