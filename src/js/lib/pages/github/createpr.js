import $ from 'jquery';
import Base from './_base';

/**
 * This class handles what happs on the create PR page
 * the code is duplicated in pr.js so copy over any changes
 *
 * @returns {Object}
 */
export default function () {
    const CreatePrPage = new Base();

    /**
     * Regex for the create new PR page
     */
    CreatePrPage.urlPath = '^(/[\\w-]+/[\\w-]+/compare/.*)$';

    /**
     * Runs on page load, adds qa guidelines content and event listener to show/hide the guidelines
     */
    CreatePrPage.setup = function () {
        // eslint-disable-next-line no-undef
        addQAGuidelines();

        // eslint-disable-next-line no-undef
        $('#k2-extension-qa-guidelines-toggle').on('change', toggleQAGuidelines);
    };

    return CreatePrPage;
}
