const minPollInterval = 60000; // 1 minute

const currentlyFetching = {};
const lastFetchTimestamps = {};

/**
 * This utility is built to ensure that each action method only starts once at a
 * time and never more than once within minPollInterval. GitHub navigation can
 * remount components and otherwise start duplicate dashboard requests.
 *
 * This should primarily be used in any action file that calls the GitHub API in an ongoing setTimeout loop. It's better to do it in the action file than in api.js because
 * other areas of the code might make one-time calls to the API methods where the throttling isn't necessary.
 *
 * @param {String} commandName must be a unique name for each action method that fetches data from the GH API and stores the results in Onyx
 * @param {Function} methodThatReturnsAPromise
 * @returns {Promise<void>}
 */
function ActionThrottle(commandName, methodThatReturnsAPromise) {
    const msSinceLastFetch = Date.now() - (lastFetchTimestamps[commandName] || null);
    if (currentlyFetching[commandName]) {
        return currentlyFetching[commandName];
    }

    if (msSinceLastFetch < minPollInterval) {
        return Promise.resolve();
    }

    const request = Promise.resolve().then(methodThatReturnsAPromise);
    currentlyFetching[commandName] = request
        .finally(() => {
            lastFetchTimestamps[commandName] = Date.now();
            delete currentlyFetching[commandName];
        });

    return currentlyFetching[commandName];
}

export default ActionThrottle;
