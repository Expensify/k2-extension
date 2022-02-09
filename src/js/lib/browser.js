/* global chrome, browser */

// Chrome does not have the browser object and instead calls it chrome
// while firefox uses a more standard browser object name so this makes
// the extension cross-browser compatible
function getBrowser() {
    if (chrome) {
        return chrome;
    }

    return browser;
}

export default getBrowser();
