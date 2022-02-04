import $ from 'jquery';
import Base from './_base';
import k2Button from '../../../template/button.github.k2.html';
import whatsnextButton from '../../../template/button.github.whatsnext.html';

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

        // Insert the what's next button right after the pull request button in the navigation
        // navigation if it's there. Also make sure to not show it multiple times
        if (!$('nav.js-repo-nav li.k2-whatsnext').length) {
            $('nav.js-repo-nav *[data-selected-links*="repo_pulls"]')
                .parent().after(whatsnextButton({url: currentUrl}));
        }

        // Insert the kernel button right after the pull request button in the
        // navigation if it's there. Also make sure to not show it multiple times
        if (!$('nav.js-repo-nav li.k2-extension').length) {
            $('nav.js-repo-nav *[data-selected-links*="repo_pulls"]')
                .parent().after(k2Button({url: currentUrl}));
        }
    };

    return AllPages;
}
