import $ from 'jquery';
import Base from './_base';

const K2picker = require('../../../module/k2picker/index');
const K2pickerType = require('../../../module/k2pickertype/index');
const K2pickerArea = require('../../../module/k2pickerarea/index');
const ToggleReview = require('../../../module/togglereview/index');

const refreshPicker = function () {
    if (!$('.k2picker-wrapper').length) {
        $('.js-issue-labels').after(`
      <div class="discussion-sidebar-item js-discussion-sidebar-item no-border k2picker-wrapper"></div>
      <div class="discussion-sidebar-item js-discussion-sidebar-item no-border k2pickertype-wrapper"></div>
      <div class="discussion-sidebar-item js-discussion-sidebar-item no-border k2pickerarea-wrapper"></div>
      <div class="discussion-sidebar-item js-discussion-sidebar-item no-border k2togglereviewing-wrapper"></div>`);
        new K2picker().draw();
        new K2pickerType().draw();
        new K2pickerArea().draw();
        new ToggleReview().draw();
    }
};

/**
 * This class handles the functionality on the issue page
 *
 * @returns {Object}
 */
export default function () {
    const IssuePage = new Base();

    /**
     * Add buttons to the page and setup the event handler
     */
    IssuePage.urlPath = '^(/[\\w-]+/[\\w-.]+/issues/\\d+)$';

    /**
     * Add buttons to the page and setup the event handler
     */
    IssuePage.setup = function () {
        setTimeout(refreshPicker, 500);

        // Listen for when the sidebar is redrawn, then redraw our pickers
        $(document).bind('DOMNodeRemoved', (e) => {
            if ($(e.target).is('#partial-discussion-sidebar')) {
                console.debug('sidebar was destroyed, setting up pickers again...');
                setTimeout(refreshPicker, 500);
            }
        });
    };

    return IssuePage;
}
