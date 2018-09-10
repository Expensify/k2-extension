'use strict';
const $ = require('jquery');
const _ = require('underscore');

const API = require('./api');
const prefs = require('./prefs');

/**
 * This library uses public Gists to store non-sensitive data.
 *
 * NEVER EVER EVER EVER
 * store anything sensitive here
 */

// The public gist where this stuff is stored
// https://gist.github.com/tgolen/eabd69f31e0cf7d9e165e0726c8d9da7
const gistID = 'eabd69f31e0cf7d9e165e0726c8d9da7';
const baseUrl = 'https://api.github.com';
const fileName = 'db.json';

// This is a local cache of the data because Github takes a little bit of time in updating it
let localCache = null;

function getGist(cb) {
  prefs.get('ghPassword', function(ghPassword) {
    $.ajax({
      url: `${baseUrl}/gists/${gistID}`,
      method: 'GET',
      dataType: 'json',
      headers: {
        Authorization: 'Basic ' + btoa(`${API.getCurrentUser()}:${ghPassword}`)
      }
    }).done(cb);
  });
}

/**
 * Stores a piece of data with a name
 *
 * @param {string} name
 * @param {mixed} value
 * @param {function} cb called when process has completed
 */
function set(name, value, cb) {
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
            Authorization: 'Basic ' + btoa(`${API.getCurrentUser()}:${ghPassword}`)
          }
        }).done(() => {
          if (_.isFunction(cb)) {
            cb();
          }
        });
      });
    } catch (e) {
      console.error(e);
      if (_.isFunction(cb)) {
        cb(e);
      }
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

exports.set = set;
exports.get = get;
