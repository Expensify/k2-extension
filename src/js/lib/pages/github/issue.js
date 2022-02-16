import $ from 'jquery';
import Base from './_base';
import sidebarWrapperHTML from '../../../template/sidebar.wrappers.html';
import K2picker from '../../../module/K2picker/K2picker';
import K2pickerarea from '../../../module/K2pickerarea/K2pickerarea';
import K2pickerType from '../../../module/K2pickertype/K2pickertype';
import ToggleReview from '../../../module/ToggleReview/ToggleReview';

const refreshPicker = function () {
    // Return early if the wrappers already exist so that they don't get redrawn unless necessary
    if ($('.k2picker-wrapper').length) {
        return;
    }

    $('.js-issue-labels').after(sidebarWrapperHTML);
    new K2picker().draw();
    new K2pickerType().draw();
    new K2pickerarea().draw();
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
