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
    let headerObserver;
    let isHeaderUpdateScheduled = false;

    const insertK2Action = () => {
        if ($('.k2-header-action').length) {
            return true;
        }

        const headerSearch = $('button:contains("Type / to search"):visible').first();
        if (headerSearch.length) {
            headerSearch.parent().after(k2Button({url: '/Expensify/Expensify'}));
            return true;
        }

        const repositoryNav = $('nav[aria-label="Repository"]').first();
        if (repositoryNav.length) {
            repositoryNav.before(k2Button({url: '/Expensify/Expensify'}));
            return true;
        }

        return false;
    };

    AllPages.init = function () {
        this.setup();
    };

    /**
     * Add buttons to the page and setup the event handler
     */
    AllPages.setup = function () {
        // Keep K2 outside GitHub's managed tab list, which breaks search when modified.
        insertK2Action();

        if (!headerObserver) {
            headerObserver = new MutationObserver(() => {
                if (isHeaderUpdateScheduled) {
                    return;
                }

                isHeaderUpdateScheduled = true;
                window.requestAnimationFrame(() => {
                    isHeaderUpdateScheduled = false;
                    insertK2Action();
                });
            });
            headerObserver.observe(document.body, {childList: true, subtree: true});
        }

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);
    };

    return AllPages;
}
