(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

let messenger = require('./lib/messenger');

messenger.startNavEventPublisher();

},{"./lib/messenger":2}],2:[function(require,module,exports){
'use strict';
/* global chrome */

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
    chrome.webNavigation[e].addListener(() => {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, 'nav');
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
  chrome.runtime.onMessage.addListener(function(request) {
    trigger(request);
  });
}

/**
 * PUBLIC API
 */
exports.startNavEventPublisher = startNavEventPublisher;
exports.startMessageListener = startMessageListener;
exports.on = on;

},{}]},{},[1]);
