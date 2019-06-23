'use strict';

const kvs2Browser = require('./browser');
let listeners = {};

/**
 * Listens to all of our nav events and sends a 'nav' message
 * to each tab when one of the events is triggered
 */
function startNavEventPublisher() {
  let navEventList = [
    'onHistoryStateUpdated'
  ];

  navEventList.forEach(function(e) {
    kvs2Browser.browser.webNavigation[e].addListener(() => {
      kvs2Browser.browser.tabs.query({
        active: true,
        currentWindow: true
      }, tabs => {
        kvs2Browser.browser.tabs.sendMessage(tabs[0].id, 'nav');
      });
    });
  });
}

/**
 * listen to specific message events and triggers the callbacks
 *
 * @param {string} eventName
 * @param {Function} cb
 */
function on(eventName, cb) {
  if (!listeners[eventName]) {
    listeners[eventName] = [];
  }

  listeners[eventName].push(cb);
}

/**
 * Trigger the callbacks for an event name and pass them optional data
 *
 * @param {string} eventName
 * @param {Object|undefined} data (optional)
 */
function trigger(eventName, data) {
  if (listeners[eventName] && listeners[eventName].length) {
    for (let i = 0; i < listeners[eventName].length; i++) {
      let callback = listeners[eventName][i];
      callback.apply(null, data);
    }
  }
}

/**
 * Listens to runtime messages and triggers the proper
 * event listeners
 */
function startMessageListener() {
  kvs2Browser.browser.runtime.onMessage.addListener(function(request) {
    trigger(request);
  });
}

/**
 * PUBLIC API
 */
exports.startNavEventPublisher = startNavEventPublisher;
exports.startMessageListener = startMessageListener;
exports.on = on;
