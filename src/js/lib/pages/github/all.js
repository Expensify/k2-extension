import $ from 'jquery';
import Base from './_base';
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
            $('body').append(k2Button({url: '/Expensify/Expensify'}));
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

        const scheduleK2TabPosition = () => {
            if (AllPages.k2TabPositionFrame) {
                return;
            }

            AllPages.k2TabPositionFrame = window.requestAnimationFrame(() => {
                AllPages.k2TabPositionFrame = null;
                positionK2Tab();
            });
        };

        if (AllPages.k2TabScrollHandler) {
            document.removeEventListener('scroll', AllPages.k2TabScrollHandler, true);
        }

        if (AllPages.k2TabPositionObserver) {
            AllPages.k2TabPositionObserver.disconnect();
        }

        if (AllPages.k2TabResizeObserver) {
            AllPages.k2TabResizeObserver.disconnect();
        }

        positionK2Tab();

        // Keep the isolated tab aligned when GitHub reflows or scrolls its tab list.
        AllPages.k2TabScrollHandler = scheduleK2TabPosition;
        document.addEventListener('scroll', AllPages.k2TabScrollHandler, true);

        $(window)
            .off('resize.k2-extension scroll.k2-extension')
            .on('resize.k2-extension scroll.k2-extension', scheduleK2TabPosition);

        const repositoryNavigation = $('nav[aria-label="Repository"]').first();
        if (repositoryNavigation.length) {
            AllPages.k2TabPositionObserver = new MutationObserver(scheduleK2TabPosition);
            AllPages.k2TabPositionObserver.observe(repositoryNavigation[0], {
                attributes: true,
                childList: true,
                subtree: true,
            });

            AllPages.k2TabResizeObserver = new ResizeObserver(scheduleK2TabPosition);
            AllPages.k2TabResizeObserver.observe(repositoryNavigation[0]);
        }

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);
    };

    return AllPages;
}
