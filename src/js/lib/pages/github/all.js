import $ from 'jquery';
import Base from './_base';
import k2Button from '../../../template/button.github.k2.html';
import * as markdownCopy from '../../markdownCopy';

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
     * Insert the K2 button into the navigation if it doesn't exist
     *
     * @returns {boolean} True if button exists or was inserted, false if insertion failed
     */
    AllPages.insertK2Button = function () {
        // Hardcode because it doesn't change, and depending on GitHub markup means
        // it breaks every so often
        const currentUrl = '/Expensify/Expensify';

        // Check if K2 button already exists to avoid duplicates
        if ($('li.k2-extension').length) {
            return true;
        }

        // Find the Pull requests tab and insert K2 after it
        const pullsTab = $('nav[aria-label="Repository"] a[href*="/pulls"]').closest('li');
        if (pullsTab.length) {
            pullsTab.after(k2Button({url: currentUrl}));
            return true;
        }

        return false;
    };

    /**
     * Add buttons to the page and setup the event handler
     */
    AllPages.setup = function () {
        // Try to insert K2 button immediately
        if (!AllPages.insertK2Button()) {
            // If it fails (nav not ready yet), retry a few times with delays
            let retries = 0;
            const maxRetries = 10;
            const retryInterval = setInterval(() => {
                retries++;
                if (AllPages.insertK2Button() || retries >= maxRetries) {
                    clearInterval(retryInterval);
                }
            }, 100);
        }

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);

        // Set up "Copy as markdown" for comment menus
        markdownCopy.initMarkdownCopy();
    };

    return AllPages;
}
