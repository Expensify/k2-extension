const minPollInterval = 60000; // 1 minute

const currentlyFetching = {};
const lastFetchTimestamps = {};

function ActionThrottle(commandName, methodThatReturnsAPromise) {
    const msSinceLastFetch = Date.now() - (lastFetchTimestamps[commandName] || null);
    if (currentlyFetching[commandName] || msSinceLastFetch < minPollInterval) {
        return;
    }
    currentlyFetching[commandName] = true;

    methodThatReturnsAPromise()
        .then(() => {
            lastFetchTimestamps[commandName] = Date.now();
            currentlyFetching[commandName] = false;
        })
        .catch(() => {
            lastFetchTimestamps[commandName] = Date.now();
            currentlyFetching[commandName] = false;
        });
}

export default ActionThrottle;
