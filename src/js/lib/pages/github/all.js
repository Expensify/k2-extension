import $ from 'jquery';
import Base from './_base';
import k2Button from '../../../template/button.github.k2.html';
import * as markdownCopy from '../../markdownCopy';
import * as API from '../../api';

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
    AllPages.setup = async function () {
        // Dynamically determine which K2 repo URL to use based on user access
        // Users with access to Expensify/Expensify get that URL
        // Users without access get Expensify/App instead
        const currentUrl = await API.checkK2RepoAccess();

        // Insert the kernel button right after the pull request button in the
        // navigation if it's there. Also make sure to not show it multiple times
        if (!$('nav.js-repo-nav li.k2-extension').length) {
            $('nav.js-repo-nav *[data-selected-links*="repo_pulls"]')
                .parent().after(k2Button({url: currentUrl}));
        }

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);

        // Set up "Copy as markdown" for comment menus
        markdownCopy.initMarkdownCopy();
    };

    return AllPages;
}
