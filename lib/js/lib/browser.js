'use strict';
/* global chrome, browser */

function getBrowser() {
  if (chrome) {
    return chrome;
  }

  return browser;
}

module.exports = getBrowser();
