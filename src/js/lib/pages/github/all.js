import $ from 'jquery';
import Base from './_base';
import k2Button from '../../../template/button.github.k2.html';
import * as markdownCopy from '../../markdownCopy';
import * as ManualRequestUsers from '../../actions/ManualRequestUsers';
import HoverCard from '../../../module/HoverCard/HoverCard';

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
        // Hardcode because it doesn't change, and depending on GitHub markup means
        // it breaks every so often
        const currentUrl = '/Expensify/Expensify';

        // Insert K2 button after the Pull requests tab, retrying if the nav hasn't rendered yet
        if (!$('li.k2-extension').length) {
            const pullsTab = $('nav[aria-label="Repository"] a[href*="/pulls"]').closest('li');
            if (pullsTab.length) {
                pullsTab.after(k2Button({url: currentUrl}));
            } else {
                let retries = 0;
                const interval = setInterval(() => {
                    if ($('li.k2-extension').length || ++retries >= 10) {
                        clearInterval(interval);
                        return;
                    }
                    const tab = $('nav[aria-label="Repository"] a[href*="/pulls"]').closest('li');
                    if (tab.length) {
                        tab.after(k2Button({url: currentUrl}));
                        clearInterval(interval);
                    }
                }, 100);
            }
        }

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);

        // Set up "Copy as markdown" for comment menus
        markdownCopy.initMarkdownCopy();

        // Fetch manual-request user list and start observing hovercards
        ManualRequestUsers.fetchManualRequestUsers();
        HoverCard.draw();

        // Console shortcut: document.dispatchEvent(new Event('k2-refresh-payment-data'))
        document.addEventListener('k2-refresh-payment-data', () => {
            // eslint-disable-next-line no-console
            console.log('[K2] Force-refreshing payment data…');
            ManualRequestUsers.forceRefresh().then(() => {
                // eslint-disable-next-line no-console
                console.log('[K2] Payment data refreshed.');
            });
        });
    };

    return AllPages;
}
