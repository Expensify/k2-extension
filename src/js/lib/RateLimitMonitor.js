/**
 * RateLimitMonitor - Tracks GitHub API rate limit headers and provides throttling recommendations.
 *
 * GitHub provides rate limit headers on every response:
 * - x-ratelimit-limit: Maximum requests per hour
 * - x-ratelimit-remaining: Requests remaining in current window
 * - x-ratelimit-reset: Unix timestamp when the limit resets
 *
 * Using these headers, we can make smarter throttling decisions.
 */

// Default values (authenticated users get 5000 requests/hour)
let rateLimitLimit = 5000;
let rateLimitRemaining = 5000;
let rateLimitReset = null;
let lastUpdated = null;

// Threshold at which we start being more conservative
const LOW_LIMIT_THRESHOLD = 100;
const CRITICAL_LIMIT_THRESHOLD = 20;

/**
 * Update rate limit tracking from API response headers
 * Call this after every GitHub API response.
 *
 * @param {Object} headers - Response headers object (can be Headers object or plain object)
 */
function updateFromHeaders(headers) {
    // Handle both Headers object and plain object
    const getHeader = (name) => {
        if (typeof headers.get === 'function') {
            return headers.get(name);
        }
        return headers[name] || headers[name.toLowerCase()];
    };

    const limit = getHeader('x-ratelimit-limit');
    const remaining = getHeader('x-ratelimit-remaining');
    const resetHeader = getHeader('x-ratelimit-reset');

    if (limit !== null && limit !== undefined) {
        rateLimitLimit = parseInt(limit, 10);
    }
    if (remaining !== null && remaining !== undefined) {
        rateLimitRemaining = parseInt(remaining, 10);
    }
    if (resetHeader !== null && resetHeader !== undefined) {
        rateLimitReset = parseInt(resetHeader, 10) * 1000; // Convert to milliseconds
    }

    lastUpdated = Date.now();

    // Log warning if rate limit is getting low
    if (rateLimitRemaining < LOW_LIMIT_THRESHOLD) {
        // eslint-disable-next-line no-console
        console.warn(
            `K2 Extension: GitHub API rate limit low (${rateLimitRemaining}/${rateLimitLimit} remaining)`,
        );
    }
}

/**
 * Check if we should throttle requests to avoid hitting rate limits
 * @returns {Boolean} - True if we should slow down
 */
function shouldThrottle() {
    return rateLimitRemaining < LOW_LIMIT_THRESHOLD;
}

/**
 * Check if we're critically low on rate limit
 * @returns {Boolean} - True if we should stop non-essential requests
 */
function isCritical() {
    return rateLimitRemaining < CRITICAL_LIMIT_THRESHOLD;
}

/**
 * Get the current rate limit status
 * @returns {Object} - Rate limit information
 */
function getStatus() {
    return {
        limit: rateLimitLimit,
        remaining: rateLimitRemaining,
        reset: rateLimitReset,
        resetIn: rateLimitReset
            ? Math.max(0, rateLimitReset - Date.now())
            : null,
        lastUpdated,
        isLow: rateLimitRemaining < LOW_LIMIT_THRESHOLD,
        isCritical: rateLimitRemaining < CRITICAL_LIMIT_THRESHOLD,
    };
}

/**
 * Get recommended delay before making the next request (in milliseconds).
 * Returns 0 if no delay is needed.
 *
 * @returns {Number} - Milliseconds to wait
 */
function getRecommendedDelay() {
    if (rateLimitRemaining >= LOW_LIMIT_THRESHOLD) {
        return 0;
    }

    // If we're critically low and have reset time, wait until reset
    if (rateLimitRemaining < CRITICAL_LIMIT_THRESHOLD && rateLimitReset) {
        const msUntilReset = rateLimitReset - Date.now();
        if (msUntilReset > 0) {
            // Don't wait more than 5 minutes
            return Math.min(msUntilReset, 300000);
        }
    }

    // If we're low but not critical, just add a small delay
    if (rateLimitRemaining < LOW_LIMIT_THRESHOLD) {
        return 5000; // 5 second delay
    }

    return 0;
}

/**
 * Get the multiplier to apply to polling intervals based on rate limit status.
 * Normal = 1x, Low = 2x, Critical = 4x
 *
 * @returns {Number} - Multiplier for polling intervals
 */
function getIntervalMultiplier() {
    if (rateLimitRemaining < CRITICAL_LIMIT_THRESHOLD) {
        return 4;
    }
    if (rateLimitRemaining < LOW_LIMIT_THRESHOLD) {
        return 2;
    }
    return 1;
}

/**
 * Reset rate limit tracking (for testing or when re-authenticating)
 */
function reset() {
    rateLimitLimit = 5000;
    rateLimitRemaining = 5000;
    rateLimitReset = null;
    lastUpdated = null;
}

export {
    updateFromHeaders,
    shouldThrottle,
    isCritical,
    getStatus,
    getRecommendedDelay,
    getIntervalMultiplier,
    reset,
};
