(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

let messenger = require('./lib/messenger');

messenger.startNavEventPublisher();

},{"./lib/messenger":2}],2:[function(require,module,exports){
'use strict';
/* global chrome */

var listeners = {};

/**
 * Listens to all of our nav events and sends a 'nav' message
 * to each tab when one of the events is triggered
 */
function startNavEventPublisher() {
  var navEventList = ['onHistoryStateUpdated'];

  navEventList.forEach(function (e) {
    chrome.webNavigation[e].addListener(function () {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function (tabs) {
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
    for (var i = 0; i < listeners[eventName].length; i++) {
      var callback = listeners[eventName][i];
      callback.apply(null, data);
    }
  }
}

/**
 * Listens to runtime messages and triggers the proper
 * event listeners
 */
function startMessageListener() {
  chrome.runtime.onMessage.addListener(function (request) {
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
