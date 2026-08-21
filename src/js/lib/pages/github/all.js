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
        const k2Action = $('.k2-nav-action');

        if (!k2Action.length) {
            // Keep K2 outside GitHub's managed tab list, which breaks search when modified.
            const repositoryNav = $('nav[aria-label="Repository"]').first();
            if (repositoryNav.length) {
                repositoryNav.after(k2Button({url: '/Expensify/Expensify'}));
            }
        }

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);
    };

    return AllPages;
}
