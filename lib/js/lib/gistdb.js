'use strict';
const $ = require('jquery');
const _ = require('underscore');

const API = require('./api');

/**
 * This library uses public Gists to store non-sensitive data.
 *
 * NEVER EVER EVER EVER
 * store anything sensitive in this Gist
 */

// The public gist where this stuff is stored
// https://gist.github.com/botify/cf7f70654831b3aa7151db8f8715f71c
const gistID = 'cf7f70654831b3aa7151db8f8715f71c';
const baseUrl = 'https://api.github.com';
const fileName = 'gistfile1.txt';
const userToken = 'eb7c674af177655c173f2d6f19c45a858133a969';

// This is a local cache of the data because Github takes a little bit of time in updating it
let localCache = null;

function getGist(cb) {
  $.ajax({
    url: `${baseUrl}/gists/${gistID}`,
    method: 'GET',
    dataType: 'json',
    headers: {
      Authorization: 'Basic ' + btoa(`${API.getCurrentUser()}:${userToken}`)
    }
  }).done(cb);
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

      $.ajax({
        url: `${baseUrl}/gists/${gistID}`,
        method: 'PATCH',
        data: JSON.stringify(gistToSave),
        dataType: 'json',
        headers: {
          Authorization: 'Basic ' + btoa(`${API.getCurrentUser()}:${userToken}`)
        }
      }).done(() => {
        if (_.isFunction(cb)) {
          cb();
        }
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
    let data;
    try {
      data = JSON.parse(gist.files[fileName].content);
    } catch (e) {
      console.error(e);
      cb(e);
      return;
    }
    cb(null, data[name]);
  });
}

exports.set = set;
exports.get = get;
