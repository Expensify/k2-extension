import $ from 'jquery';
import ReactNativeOnyx from 'react-native-onyx';
import Base from './_base';
import sidebarWrapperHTML from '../../../template/sidebar.wrappers.html';
import K2picker from '../../../module/K2picker/K2picker';
import K2pickerarea from '../../../module/K2pickerarea/K2pickerarea';
import K2pickerType from '../../../module/K2pickertype/K2pickertype';
import ToggleReview from '../../../module/ToggleReview/ToggleReview';
import K2comments from '../../../module/K2comments/K2comments';
import ONYXKEYS from '../../../ONYXKEYS';

/**
 * This method is all about adding the "issue owner" functionality which melvin will use to see who should be providing ksv2 updates to an issue.
 */
const refreshAssignees = () => {
    // Do nothing if there is only one person assigned
    if ($('.js-issue-assignees > p > span').length <= 1) {
        return;
    }

    /* eslint-disable rulesdir/prefer-underscore-method */
    $('.js-issue-assignees > p > span').each((i, el) => {
        // If the button was already drawn, exit early
        if ($(el).find('.k2button').length) {
            return;
        }

        // Check if there is an owner already
        const ghDescription = $('.comment-body').text();
        const issueOwner = ghDescription.match(/Current Issue Owner:\s(@\S+)/gi);

        console.log(issueOwner)

        $(el).append(`
            <button type="button" class="Button Button--secondary Button--small flex-md-order-2 m-0 k2button">
                Make owner
            </button>
        `);
    });
};

const refreshPicker = function () {
    // Add our wrappers to the DOM which all the React components will be rendered into
    if (!$('.k2picker-wrapper').length) {
        $('.js-issue-labels').after(sidebarWrapperHTML);
    }

    new K2picker().draw();
    new K2pickerType().draw();
    new K2pickerarea().draw();
    new ToggleReview().draw();
    new K2comments().draw();
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
        setTimeout(refreshPicker, 500);
        setTimeout(refreshAssignees, 500);

        // Listen for when the sidebar is redrawn, then redraw our pickers
        $(document).bind('DOMNodeRemoved', (e) => {
            if (!$(e.target).is('#partial-discussion-sidebar')) {
                return;
            }
            setTimeout(refreshPicker, 500);
            setTimeout(refreshAssignees, 500);
        });
    };

    return IssuePage;
}
