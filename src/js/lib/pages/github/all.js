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

        if (AllPages.k2TabPositionFrame) {
            window.cancelAnimationFrame(AllPages.k2TabPositionFrame);
        }
        AllPages.k2TabPositionFrame = null;

        if (AllPages.k2TabNavigationFrame) {
            window.cancelAnimationFrame(AllPages.k2TabNavigationFrame);
        }
        AllPages.k2TabNavigationFrame = null;

        if (AllPages.k2TabScrollHandler) {
            document.removeEventListener('scroll', AllPages.k2TabScrollHandler, true);
        }

        if (AllPages.k2TabPositionObserver) {
            AllPages.k2TabPositionObserver.disconnect();
        }
        AllPages.k2TabPositionObserver = null;

        if (AllPages.k2TabResizeObserver) {
            AllPages.k2TabResizeObserver.disconnect();
        }
        AllPages.k2TabResizeObserver = null;

        if (AllPages.k2TabNavigationObserver) {
            AllPages.k2TabNavigationObserver.disconnect();
        }
        AllPages.k2TabNavigationObserver = null;
        AllPages.k2TabRepositoryNavigation = null;

        const repositoryNavigationSelector = 'nav[aria-label="Repository"]';
        const observeRepositoryNavigation = () => {
            const repositoryNavigation = $(repositoryNavigationSelector).first()[0];

            if (AllPages.k2TabRepositoryNavigation === repositoryNavigation) {
                return;
            }

            if (AllPages.k2TabPositionObserver) {
                AllPages.k2TabPositionObserver.disconnect();
            }

            if (AllPages.k2TabResizeObserver) {
                AllPages.k2TabResizeObserver.disconnect();
            }

            AllPages.k2TabRepositoryNavigation = repositoryNavigation;
            scheduleK2TabPosition();

            if (!repositoryNavigation) {
                return;
            }

            AllPages.k2TabPositionObserver = new MutationObserver(scheduleK2TabPosition);
            AllPages.k2TabPositionObserver.observe(repositoryNavigation, {
                attributes: true,
                childList: true,
                subtree: true,
            });

            AllPages.k2TabResizeObserver = new ResizeObserver(scheduleK2TabPosition);
            AllPages.k2TabResizeObserver.observe(repositoryNavigation);
        };

        const scheduleRepositoryNavigationObservation = () => {
            if (AllPages.k2TabNavigationFrame) {
                return;
            }

            AllPages.k2TabNavigationFrame = window.requestAnimationFrame(() => {
                AllPages.k2TabNavigationFrame = null;
                observeRepositoryNavigation();
            });
        };

        positionK2Tab();

        // Keep the isolated tab aligned when GitHub reflows or scrolls its tab list.
        AllPages.k2TabScrollHandler = scheduleK2TabPosition;
        document.addEventListener('scroll', AllPages.k2TabScrollHandler, true);

        $(window)
            .off('resize.k2-extension scroll.k2-extension')
            .on('resize.k2-extension scroll.k2-extension', scheduleK2TabPosition);

        observeRepositoryNavigation();

        // GitHub can replace the repository navigation during SPA navigation.
        AllPages.k2TabNavigationObserver = new MutationObserver((records) => {
            const navigationChanged = records.some(record => Array.from(record.addedNodes)
                .concat(Array.from(record.removedNodes))
                .some((node) => {
                    if (node.nodeType !== Node.ELEMENT_NODE) {
                        return false;
                    }

                    return node.matches(repositoryNavigationSelector) || node.querySelector(repositoryNavigationSelector);
                }));

            if (navigationChanged) {
                scheduleRepositoryNavigationObservation();
            }
        });
        AllPages.k2TabNavigationObserver.observe(document.documentElement, {childList: true, subtree: true});

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);
    };

    return AllPages;
}
