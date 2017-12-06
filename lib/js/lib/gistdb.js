'use strict';
let $ = require('jquery');
let prefs = require('./prefs');

/**
 * This library uses public Gists to store non-sensitive data.
 *
 * NEVER EVER EVER EVER
 * store anything sensitive here
 */

// The public gist where this stuff is stored
// https://gist.github.com/tgolen/3092a40dea89aeb78e5ad0cce86bb0b1
const gistID = '3092a40dea89aeb78e5ad0cce86bb0b1';
const baseUrl = 'https://api.github.com';
const fileName = 'db.json';

// This is a local cache of the data because Github takes a little bit of time in updating it
let localCache = null;

function getGist(cb) {
  $.get(`${baseUrl}/gists/${gistID}`).done(cb);
}

/**
 * Stores a piece of data with a name
 *
 * @param {string} name
 * @param {mixed} value
 * @param {function} cb called when process has completed
 */
function set(name, value, cb) {
  const currentUser = $('.user-nav .avatar').attr('alt').replace('@', '');
  getGist(gist => {
    try {
      const data = JSON.parse(gist.files[fileName].content);
      data[name] = value;

      const gistToSave = {
        description: '',
        files: {}
      };
      gistToSave.files[fileName] = {
        content: JSON.stringify(data)
      };

      // Save our data to a local cache
      localCache = data;

      prefs.get('ghPassword', function(ghPassword) {
        $.ajax({
          url: `${baseUrl}/gists/${gistID}`,
          method: 'PATCH',
          data: JSON.stringify(gistToSave),
          dataType: 'json',
          headers: {
            Authorization: 'Basic ' + btoa(currentUser + ':' + ghPassword)
          }
        }).done(cb);
      });
    } catch (e) {
      console.error(e);
      cb(e);
    }
  });
}

/**
 * Returns a previously stored piece of data
 *
 * @param {string} name
 * @param {function} cb passed the value stored with the given name
 *
 * @return {mixed}
 */
function get(name, cb) {
  if (localCache) {
    return cb(null, localCache[name]);
  }
  getGist(gist => {
    try {
      const data = JSON.parse(gist.files[fileName].content);
      cb(null, data[name]);
    } catch (e) {
      console.error(e);
      cb(e);
    }
  });
}

/**
 * Remove all user preferences from storage
 *
 * @param {string} name (optional), if provided it will clear out only a single
 *                      setting, or else we will clear out all settings
 */
function clear(name) {

}

exports.set = set;
exports.get = get;
exports.clear = clear;
