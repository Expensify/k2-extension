// Function to import data into IndexedDB
function importOnyxData(data) {
    const request = indexedDB.open('OnyxDB');

    request.onerror = function (event) {
        console.error('Error opening database:', event.target.error);
    };

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction('keyvaluepairs', 'readwrite');
        const store = transaction.objectStore('keyvaluepairs');

        Object.entries(data).forEach(([key, value]) => {
            store.put(value, key);
        });

        transaction.oncomplete = function () {
            console.log('Import completed successfully');
            db.close();
        };

        transaction.onerror = function (event) {
            console.error('Error during import:', event.target.error);
        };
    };
}

// Usage:
// 1. Copy your data object
// 2. Paste it into the console like this:
// importOnyxData({
//     issuePriorities_Daily: { /* your data */ },
//     issuePriorities_Weekly: { /* your data */ }
// });
