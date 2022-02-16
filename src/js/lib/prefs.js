
import ksBrowser from './browser';

/**
 * This library uses browser's local storage to store user
 * preferences. It's a better way than storing them in cookies.
 */

/**
 * Stores a piece of data with a name
 *
 * @date 2015-05-05
 *
 * @param {string} name
 * @param {mixed} value
 * @param {function} cb called when process has completed
 */
function set(name, value, cb) {
    const params = {};
    params[name] = value;
    ksBrowser.storage.sync.set(params, cb);
}

/**
 * Returns a previously stored piece of data
 *
 * @date 2015-05-05
 *
 * @param {string} name
 * @param {function} cb passed the value stored with the given name
 *
 * @return {mixed}
 */
function get(name, cb) {
    return ksBrowser.storage.sync.get(name, (data) => {
        cb(data[name]);
    });
}

/**
 * Remove all user preferences from storage
 *
 * @date 2015-05-05
 *
 * @param {string} name (optional), if provided it will clear out only a single
 *                      setting, or else we will clear out all settings
 */
function clear(name) {
    if (name) {
        ksBrowser.storage.sync.remove(name);
    } else {
        ksBrowser.storage.sync.clear();
    }
}

export {
    set,
    get,
    clear,
};
