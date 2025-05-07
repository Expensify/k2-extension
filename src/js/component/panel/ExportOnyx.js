
// Function to get the value for a single key from IndexedDB
function getValueFromIndexedDB(dbName, storeName, key) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);

            const getRequest = objectStore.get(key);
            getRequest.onsuccess = function(event) {
                resolve(event.target.result);
            };

            getRequest.onerror = function(event) {
                reject(`Error retrieving value for key "${key}": ${event.target.error}`);
            };
        };

        request.onerror = function(event) {
            reject(`Error opening database "${dbName}": ${event.target.error}`);
        };
    });
}

// Function to get values for a list of keys, aggregate them into an object, and copy to clipboard
async function getValuesAndLog(dbName, storeName, keys) {
    const result = {};

    for (const key of keys) {
        try {
            const value = await getValueFromIndexedDB(dbName, storeName, key);
            result[key] = value;
        } catch (error) {
            console.error(error);
            result[key] = null; // Add null for keys that couldn't be retrieved
        }
    }

    console.log('Retrieved values:', result);
}

const keysToRetrieve = ['issuePriorities_Daily', 'issuePriorities_Weekly', 'issuePriorities_Monthly', 'issueAssigned', 'issueCheckboxes'];
getValuesAndLog('OnyxDB', 'keyvaluepairs', keysToRetrieve);
