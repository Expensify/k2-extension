import $ from 'jquery';
import Base from './_base';
import Dashboard from '../../../module/dashboard/index';

/**
 * Captures computed styles from a GitHub selected tab and injects them as CSS for K2 tab
 * This allows K2 to automatically adapt to GitHub's styling changes
 */
function injectDynamicK2Styles() {
    // Find a GitHub tab that's currently selected (before we deselect it)
    const selectedGitHubTab = document.querySelector('nav[aria-label="Repository"] a[aria-current="page"]:not(.k2-nav-link)');

    if (!selectedGitHubTab) {
        return;
    }

    // Get computed styles from the selected tab
    const computedStyles = window.getComputedStyle(selectedGitHubTab);
    const beforeStyles = window.getComputedStyle(selectedGitHubTab, '::before');

    // Extract key style values
    const fontWeight = computedStyles.fontWeight;
    const color = computedStyles.color;

    // For the underline, we need ::before pseudo-element styles
    const underlineColor = beforeStyles.backgroundColor || beforeStyles.borderColor || '#fd8c73';
    const underlineHeight = beforeStyles.height || '2px';
    const underlineBorderRadius = beforeStyles.borderRadius || '6px';

    // Create or update the dynamic style element
    let styleEl = document.getElementById('k2-dynamic-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'k2-dynamic-styles';
        document.head.appendChild(styleEl);
    }

    // Inject CSS that applies GitHub's current styles to K2 tab
    styleEl.textContent = `
        .k2-nav-link.selected,
        .k2-nav-link[aria-current="page"] {
            font-weight: ${fontWeight} !important;
            color: ${color} !important;
        }

        .k2-nav-link.selected::before,
        .k2-nav-link[aria-current="page"]::before {
            content: "" !important;
            position: absolute !important;
            bottom: 0 !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: calc(100% - 16px) !important;
            height: ${underlineHeight} !important;
            background-color: ${underlineColor} !important;
            border-radius: ${underlineBorderRadius} !important;
            display: block !important;
        }
    `;
}

/**
 * This class displays the K2 Dashboard
 *
 * @returns {Object}
 */
export default function () {
    const MainPage = new Base();

    /**
     * Add buttons to the page and setup the event handler
     */
    MainPage.urlPath = '^(/[\\w-]+/[\\w-]+/?)$';

    /**
     * Add buttons to the page and setup the event handler
     */
    MainPage.setup = function () {
        // If not on K2 page, exit (cleanup is handled by content.js)
        if (window.location.hash.search('#k2') !== 0) {
            return;
        }

        // Capture GitHub's tab styles BEFORE deselecting (for dynamic styling)
        injectDynamicK2Styles();

        // Add a class to the body to indicate we're on the K2 page
        document.body.classList.add('k2-page-active');
        document.documentElement.classList.add('k2-page-active');

        // Deselect GitHub's tabs and select K2
        const currentPageLinks = $('nav[aria-label="Repository"] a[aria-current="page"]');
        currentPageLinks.removeAttr('aria-current');

        const selectedLinks = $('nav[aria-label="Repository"] a.selected');
        selectedLinks.removeClass('selected');

        const k2link = $('.k2-nav-link');
        k2link.addClass('selected');
        k2link.attr('aria-current', 'page');

        document.title = 'K2';

        const issues = new Dashboard();
        issues.draw();
    };

    return MainPage;
}
