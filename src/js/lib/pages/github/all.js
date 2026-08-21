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
        const k2Action = $('.k2-header-action');

        if (!k2Action.length) {
            // Keep K2 outside GitHub's managed tab list, which breaks search when modified.
            const repositoryContext = $(
                '#repository-container-header .d-flex.flex-wrap.flex-items-center.wb-break-word.f3.text-normal',
            ).first();
            if (repositoryContext.length) {
                repositoryContext.append(k2Button({url: '/Expensify/Expensify'}));
            }
        }

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);
    };

    return AllPages;
}
