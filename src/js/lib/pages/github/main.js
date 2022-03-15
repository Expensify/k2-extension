import $ from 'jquery';
import Base from './_base';
import Dashboard from '../../../module/dashboard/index';

/**
 * This class displays the K2 Dashboard
 *
 * @returns {Object}
 */
export default function () {
    const MainPage = new Base();

    /**
     * Add buttons to the page and setup the event handler
     */
    MainPage.urlPath = '^(/[\\w-]+/[\\w-]+/?)$';

    /**
     * Add buttons to the page and setup the event handler
     */
    MainPage.setup = function () {
        // Only do stuff if we are on the kernal page
        if (window.location.hash.search('#k2') !== 0) {
            return;
        }

        // Deselect whatever button is currently selected
        const selected = $('.js-selected-navigation-item.selected');
        selected.removeClass('selected');
        selected.removeAttr('aria-current');

        // Select our k2 button
        const k2tab = $('.js-selected-navigation-item.k2-extension');
        k2tab.addClass('selected');
        k2tab.attr('aria-current', 'page');

        document.title = 'K2';

        const issues = new Dashboard();
        issues.draw();
    };

    return MainPage;
}
