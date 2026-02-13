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
     * Add buttons to the page and setup the event handler
     */
    AllPages.setup = function () {
        // Hardcode because it doesn't change, and depending on GitHub markup means
        // it breaks every so often
        const currentUrl = '/Expensify/Expensify';

        // Check if K2 button already exists to avoid duplicates
        if ($('li.k2-extension').length) {
            return;
        }

        // Insert the K2 button after the Pull requests tab in GitHub's React-based navigation
        $('nav[aria-label="Repository"] a[href*="/pulls"]')
            .closest('li').after(k2Button({url: currentUrl}));

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);

        // Set up "Copy as markdown" for comment menus
        markdownCopy.initMarkdownCopy();
    };

    return AllPages;
}
