'use strict';
const kvs2Browser = require('./browser');

/**
 * This library uses browser's local storage to store user
 * preferences. It's a better way than storing them in cookies.
 */

/**
 * Stores a piece of data with a name
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-05-05
 *
 * @param {string} name
 * @param {mixed} value
 * @param {function} cb called when process has completed
 */
function set(name, value, cb) {
  let params = {};
  params[name] = value;
  kvs2Browser.browser.storage.sync.set(params, cb);
}

/**
 * Returns a previously stored piece of data
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-05-05
 *
 * @param {string} name
 * @param {function} cb passed the value stored with the given name
 *
 * @return {mixed}
 */
function get(name, cb) {
  return kvs2Browser.browser.storage.sync.get(name, function(data) {
    cb(data[name]);
  });
}

/**
 * Remove all user preferences from storage
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-05-05
 *
 * @param {string} name (optional), if provided it will clear out only a single
 *                      setting, or else we will clear out all settings
 */
function clear(name) {
  if (name) {
    kvs2Browser.browser.storage.sync.remove(name);
  } else {
    kvs2Browser.browser.storage.sync.clear();
  }
}

exports.set = set;
exports.get = get;
exports.clear = clear;
