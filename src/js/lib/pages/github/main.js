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
        // If not on K2 page, exit (cleanup is handled by content.js)
        if (window.location.hash.search('#k2') !== 0) {
            return;
        }

        // Mark body so CSS can override GitHub's tab selection
        document.body.classList.add('k2-page-active');

        // Deselect GitHub's tabs and select K2
        $('nav[aria-label="Repository"] a[aria-current="page"]').removeAttr('aria-current');
        $('nav[aria-label="Repository"] a.selected').removeClass('selected');

        const k2link = $('.k2-nav-link');
        k2link.addClass('selected');
        k2link.attr('aria-current', 'page');

        document.title = 'K2';

        const issues = new Dashboard();
        issues.draw();
    };

    return MainPage;
}
