import $ from 'jquery';
import Base from './_base';
import calendarSvg from '../../../../../assets/calendar.svg';
import k2Button from '../../../template/button.github.k2.html';

/**
 * This class manages the things that happen on *every* GitHub page. All it's doing is adding links to the
 * dashboard into the top navigation.
 *
 * @return {Object}
 */
export default function () {
    const AllPages = new Base();

    AllPages.init = function () {
        this.setup();
    };

    /**
     * Add buttons to the page and setup the event handler
     */
    AllPages.setup = function () {
        let k2Tab = $('li.k2-extension');

        if (!k2Tab.length) {
            // Keep the K2 tab outside GitHub's managed list because inserting it into that list breaks search.
            $('body').append(k2Button({url: '/Expensify/Expensify', calendarSvg}));
            k2Tab = $('li.k2-extension');
        }

        const positionK2Tab = () => {
            const pullsTab = $('nav[aria-label="Repository"] a[href*="/pulls"]').first();

            if (!pullsTab.length) {
                k2Tab.hide();
                return;
            }

            // Use the Pull requests position so the isolated K2 tab looks like part of GitHub's tab list.
            const rectangle = pullsTab[0].getBoundingClientRect();
            k2Tab.css({
                display: 'flex',
                position: 'fixed',
                top: rectangle.top,
                left: rectangle.right + 8,
                height: rectangle.height,
                zIndex: 1000,
            });
        };

        positionK2Tab();

        // Keep the isolated tab aligned when the window moves GitHub's tab list.
        $(window)
            .off('resize.k2-extension scroll.k2-extension')
            .on('resize.k2-extension scroll.k2-extension', positionK2Tab);

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);
    };

    return AllPages;
}
