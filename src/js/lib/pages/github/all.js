import $ from 'jquery';
import Base from './_base';
import positionK2Tab from '../../positionK2Tab';

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
        positionK2Tab();

        // Keep the isolated tab aligned when the window moves GitHub's tab list.
        $(window)
            .off('resize.k2-extension scroll.k2-extension')
            .on('resize.k2-extension scroll.k2-extension', () => {
                positionK2Tab();
            });

        // Set up timestamp format conversion
        setTimeout(() => AllPages.applyTimestampFormat(), 500);
        setInterval(() => AllPages.applyTimestampFormat(), 5000);
    };

    return AllPages;
}
