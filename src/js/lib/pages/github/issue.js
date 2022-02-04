import $ from 'jquery';
import Base from './_base';
import sidebarWrapperHTML from '../../../template/sidebar.wrappers.html';

const K2picker = require('../../../module/k2picker/index');
const K2pickerType = require('../../../module/k2pickertype/index');
const K2pickerArea = require('../../../module/k2pickerarea/index');
const ToggleReview = require('../../../module/togglereview/index');

const refreshPicker = function () {
    // Return early if the wrappers already exist so that they don't get redrawn unless necessary
    if ($('.k2picker-wrapper').length) {
        return;
    }

    $('.js-issue-labels').after(sidebarWrapperHTML);
    new K2picker().draw();
    new K2pickerType().draw();
    new K2pickerArea().draw();
    new ToggleReview().draw();
};

/**
 * This class handles the functionality on the issue page
 *
 * @returns {Object}
 */
export default function () {
    const IssuePage = new Base();

    IssuePage.urlPath = '^(/[\\w-]+/[\\w-.]+/issues/\\d+)$';

    IssuePage.setup = function () {
        setTimeout(refreshPicker, 500);

        // Listen for when the sidebar is redrawn, then redraw our pickers
        $(document).bind('DOMNodeRemoved', (e) => {
            if (!$(e.target).is('#partial-discussion-sidebar')) {
                return;
            }
            setTimeout(refreshPicker, 500);
        });
    };

    return IssuePage;
}
