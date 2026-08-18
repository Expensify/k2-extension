const minPollInterval = 60000; // 1 minute
const maxFetchDuration = 300000; // 5 minutes

const currentlyFetching = {};
const lastFetchTimestamps = {};

/**
 * This utility is built to ensure that each action method will only be called once at a time, and never more than once in the minPollInterval time.
 * It was necessary to add this because GH ends up doing a lot of page refreshing, which causes components to re-render, which causes fetch() to be called
 * more times than intended. This repeated calling of the API results in API thresholds being hit with GH.
 *
 * This should primarily be used in any action file that calls the GitHub API in an ongoing setTimeout loop. It's better to do it in the action file than in api.js because
 * other areas of the code might make one-time calls to the API methods where the throttling isn't necessary.
 *
 * @param {String} commandName must be a unique name for each action method that fetches data from the GH API and stores the results in Onyx
 * @param {Function} methodThatReturnsAPromise
 * @returns {Promise<void>}
 */
function ActionThrottle(commandName, methodThatReturnsAPromise) {
    const now = Date.now();
    const fetchStartedAt = currentlyFetching[commandName];
    const fetchIsActive = fetchStartedAt && now - fetchStartedAt < maxFetchDuration;
    const msSinceLastFetch = now - (lastFetchTimestamps[commandName] || 0);
    if (fetchIsActive || msSinceLastFetch < minPollInterval) {
        return Promise.resolve();
    }
    currentlyFetching[commandName] = now;
    lastFetchTimestamps[commandName] = now;

    return Promise.resolve()
        .then(methodThatReturnsAPromise)
        .then(() => undefined)
        .catch(error => console.error(`K2 refresh failed for ${commandName}:`, error))
        .finally(() => {
            if (currentlyFetching[commandName] !== now) {
                return;
            }
            delete currentlyFetching[commandName];
        });
}

export default ActionThrottle;
