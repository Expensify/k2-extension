
/**
 * This pages manages the pull requests page
 */
import $ from 'jquery';
import Dashboard from '../../../module/dashboard/index';

const Base = require('./_base');
const WhatsNext = require('../../../module/whatsnext/index');

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
        if (window.location.hash.search('#k2') === 0) {
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
            return;
        }

        if (window.location.hash.search('#whatsnext') === 0) {
            // Deselect the code button
            const selected = $('.js-selected-navigation-item.selected');
            selected.removeClass('selected');
            selected.removeAttr('aria-current');

            // Select our what's next button
            const wnTab = $('.js-selected-navigation-item.k2-whatsnext');
            wnTab.addClass('selected');
            wnTab.attr('aria-current', 'page');

            document.title = 'What\'s Next';

            const whatsNext = new WhatsNext();
            whatsNext.draw();
        }
    };

    return MainPage;
}
