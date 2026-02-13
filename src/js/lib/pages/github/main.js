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
        // If not on K2 page, clean up and exit
        if (window.location.hash.search('#k2') !== 0) {
            document.body.classList.remove('k2-page-active');
            document.documentElement.classList.remove('k2-page-active');
            $('.k2-nav-link').removeClass('selected').removeAttr('aria-current');
            return;
        }

        // Add a class to the body to indicate we're on the K2 page
        // This allows CSS to override GitHub's tab selection styling
        // Use direct DOM manipulation for reliability
        document.body.classList.add('k2-page-active');
        document.documentElement.classList.add('k2-page-active');

        // Try to deselect GitHub's tabs and select K2
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
