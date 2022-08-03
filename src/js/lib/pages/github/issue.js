import $ from 'jquery';
import ReactNativeOnyx from 'react-native-onyx';
import Base from './_base';
import sidebarWrapperHTML from '../../../template/sidebar.wrappers.html';
import K2picker from '../../../module/K2picker/K2picker';
import K2pickerarea from '../../../module/K2pickerarea/K2pickerarea';
import K2pickerType from '../../../module/K2pickertype/K2pickertype';
import ToggleReview from '../../../module/ToggleReview/ToggleReview';
import ReviewedDocComment from '../../../module/ReviewedDocComment/ReviewedDocComment';
import ONYXKEYS from '../../../ONYXKEYS';

const refreshPicker = function () {
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
    ReactNativeOnyx.init({
        keys: ONYXKEYS,
    });

    const IssuePage = new Base();

    IssuePage.urlPath = '^(/[\\w-]+/[\\w-.]+/issues/\\d+)$';

    IssuePage.setup = function () {
        // Add our wrappers to the DOM which all the React components will be rendered into
        if (!$('.k2picker-wrapper').length) {
            $('.js-issue-labels').after(sidebarWrapperHTML);
        }

        // This doesn't need to be refreshed with the other pickers in refreshPicker()
        new ReviewedDocComment().draw();

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
