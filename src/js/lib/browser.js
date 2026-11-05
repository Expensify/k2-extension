/* global chrome, browser */

// Chrome does not have the browser object and instead calls it chrome
// while firefox uses a more standard browser object name so this makes
// the extension cross-browser compatible
function getBrowser() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        return chrome;
    }

    if (typeof browser !== 'undefined' && browser.runtime) {
        return browser;
    }

    return null;
}

export default getBrowser();
