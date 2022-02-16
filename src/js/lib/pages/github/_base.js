import $ from 'jquery';

/**
 * This class is to be extended by each of the distinct types of webpages that the extension works on
 * @returns {Object}
 */
export default function () {
    const Page = {};

    /**
     * A unique identifier for each page
     */
    Page.id = '';

    /**
     * A string to match the last part of the URL path to
     * determine if this is a webpage that the extension works on
     */
    Page.urlPath = '';

    Page.init = function () {
        // The home page is a special case because the pathname will be empty
        if (this.urlPath === ''
            && (window.location.pathname === '' || window.location.pathname === '/')) {
            return this.setup();
        }

        if (this.urlPath === '' && window.location.pathname !== '') {
            return;
        }

        // Check if the page currently open matches the URL path defined for this page class
        const regex = new RegExp(this.urlPath);
        if (!regex.test(window.location.pathname)) {
            return;
        }

        this.setup();
    };

    /**
     * This is the method that is ran after a page has matched the URL.
     * All the magic should start here.
     *
     * This should be extended for each page type.
     */
    Page.setup = function () {};

    Page.getRepoOwner = function () {
        return $('.author a span').text();
    };

    Page.getRepo = function () {
        return $('.js-current-repository').text();
    };

    return Page;
}
