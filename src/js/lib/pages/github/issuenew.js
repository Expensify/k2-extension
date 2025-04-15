import $ from 'jquery';
import Base from './_base';

/**
 * This class manages what happens on the new issue page
 *
 * @returns {Object}
 */
export default function () {
    const IssueNewPage = new Base();

    /**
     * Add buttons to the page and setup the event handler
     */
    IssueNewPage.urlPath = '^(/[\\w-]+/[\\w-]+/issues/new)$';

    /**
     * Remove all of the sidebar wrappers
     */
    IssueNewPage.setup = function () {
        $('.k2picker-wrapper, .k2pickerarea-wrapper, .k2pickertype-wrapper, .k2togglereviewing-wrapper, .k2comments-wrapper', '.k2previousissues-wrapper').remove();
    };

    return IssueNewPage;
}
