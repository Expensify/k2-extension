import _ from 'underscore';

/**
 * Opens every item's `url` property in a new browser tab.
 * @param {Object|Array} items - collection of objects that each have a `url` property
 */
function openAllUrls(items) {
    _.each(items, item => window.open(item.url, '_blank'));
}

export default openAllUrls;
