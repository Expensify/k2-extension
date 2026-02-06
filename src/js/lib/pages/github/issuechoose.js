import _ from 'underscore';
import Base from './_base';

/**
 * This page handler enhances the issue template chooser.
 * It works on both:
 * - The dedicated /issues/new/choose page
 * - The "New Issue" overlay dialog that appears on /issues pages
 *
 * It adds:
 * 1. Alphabetical sorting of templates
 * 2. A "Blank issue" button at the top of the list
 * 3. A search/filter box to quickly find templates
 *
 * @returns {Object}
 */
export default function () {
    const IssueChoosePage = new Base();

    // Match both /issues (for the overlay dialog) and /issues/new/choose (for the full page)
    IssueChoosePage.urlPath = '^(/[\\w-]+/[\\w-.]+/issues(/new/choose)?)$';

    /**
     * Get the title text of a template item for sorting and filtering.
     * Checks for semantic elements first (strong, b, h3, h4), then falls back
     * to the first line of text (handles Primer React styled-span titles).
     *
     * @param {Element} element - A template list item element
     * @returns {string} The title text
     */
    function getItemTitle(element) {
        // Try semantic title elements first (used on /issues/new/choose page)
        const titleEl = element.querySelector('strong, b, h3, h4');
        if (titleEl) {
            return titleEl.textContent.trim();
        }

        // Fall back to first line of text (handles Primer React dialog items
        // where titles are styled spans, not semantic elements)
        return element.textContent.trim().split('\n')[0].trim();
    }

    /**
     * Walk up the DOM from a set of links to find their common parent container
     * where each direct child contains roughly one template link.
     *
     * @param {Element[]} templateLinks - The template link elements
     * @param {Element} [stopAt] - Optional ancestor to stop walking at
     * @returns {{container: Element, items: Element[]} | null}
     */
    function findContainerForLinks(templateLinks, stopAt) {
        let container = null;
        let items = [];

        const candidates = [];
        let node = templateLinks[0].parentElement;
        while (node && node !== document.body && node !== stopAt) {
            candidates.push(node);
            node = node.parentElement;
        }

        _.each(candidates, (candidate) => {
            if (container) {
                return;
            }
            const containsAll = _.every(templateLinks, link => candidate.contains(link));
            if (!containsAll) {
                return;
            }

            const matchingChildren = _.filter(Array.from(candidate.children), child => _.some(templateLinks, link => child === link || child.contains(link)));

            // A good container has roughly one child per template link
            if (matchingChildren.length >= templateLinks.length
                && matchingChildren.length <= templateLinks.length * 1.5) {
                container = candidate;
                items = matchingChildren;
            }
        });

        if (!container || items.length < 2) {
            return null;
        }
        return {container, items};
    }

    /**
     * Find template items inside an overlay/dialog element.
     * Used when GitHub shows the template chooser as a dialog on the /issues page
     * rather than navigating to /issues/new/choose.
     *
     * In the dialog, template links don't have /issues/new?template= hrefs
     * and use Primer React components (styled spans instead of strong/b elements),
     * so we identify them as all <a> links in the dialog with sufficient text content.
     *
     * @returns {{container: Element, items: Element[]} | null}
     */
    function findTemplateListInOverlay() {
        const dialogs = document.querySelectorAll('dialog, [role="dialog"]');
        let result = null;

        _.each(Array.from(dialogs), (dialog) => {
            if (result) {
                return;
            }

            // In the dialog, action buttons (Close, Copy link) are <button> elements,
            // so all <a> links are template items. Filter out any links with very
            // short text (navigation/icon links) just in case.
            const allLinks = Array.from(dialog.querySelectorAll('a'));
            const templateLinks = _.filter(allLinks, (link) => {
                const text = link.textContent.trim();
                return text.length >= 3;
            });

            if (templateLinks.length < 2) {
                return;
            }

            result = findContainerForLinks(templateLinks, dialog);
        });

        return result;
    }

    /**
     * Find the container element that holds all template items.
     * Tries two strategies:
     * 1. href-based: finds links pointing to /issues/new?template=... (works on /issues/new/choose)
     * 2. overlay-based: finds template links inside a dialog by their structure (works on /issues overlay)
     *
     * @returns {{container: Element, items: Element[]} | null}
     */
    function findTemplateList() {
        // Strategy 1: Find links pointing to issue creation with templates
        // These have hrefs like /owner/repo/issues/new?template=something
        const links = Array.from(document.querySelectorAll('a[href*="/issues/new"]'));
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        const templateLinks = _.filter(links, (link) => {
            const href = link.getAttribute('href') || '';
            return href.includes('/issues/new?') || /\/issues\/new\/[^c][^h]/.test(href);
        });

        if (templateLinks.length >= 2) {
            return findContainerForLinks(templateLinks);
        }

        // Strategy 2: Find template items in "New Issue" overlay dialog
        return findTemplateListInOverlay();
    }

    /**
     * Add a search input that filters the template list by title and description
     *
     * @param {Element} container - The template list container
     * @param {Element[]} items - The template item elements
     */
    function addSearchBox(container, items) {
        const wrapper = document.createElement('div');
        wrapper.className = 'k2-template-search';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search templates\u2026';
        input.className = 'k2-template-search-input';

        input.addEventListener('input', () => {
            const query = input.value.toLowerCase();
            _.each(items, (item) => {
                const text = item.textContent.toLowerCase();
                const el = item;
                el.style.display = text.includes(query) ? '' : 'none';
            });

            // Hide blank issue button while searching
            const blankBtn = container.querySelector('.k2-blank-issue');
            if (blankBtn) {
                blankBtn.style.display = query ? 'none' : '';
            }
        });

        wrapper.appendChild(input);
        container.parentElement.insertBefore(wrapper, container);

        // Focus the search input so the user can start typing immediately
        setTimeout(() => input.focus(), 100);
    }

    /**
     * Add a "Blank issue" link at the top of the template list.
     * Clones an existing item for consistent styling, then updates the content.
     *
     * @param {Element} container - The template list container
     */
    function addBlankIssueButton(container) {
        const pathParts = window.location.pathname.split('/');
        const owner = pathParts[1];
        const repo = pathParts[2];
        const blankUrl = `/${owner}/${repo}/issues/new`;

        const firstItem = container.children[0];
        if (!firstItem) {
            return;
        }

        // Clone an existing item so we inherit the same structure and classes
        const blankItem = firstItem.cloneNode(true);
        blankItem.classList.add('k2-blank-issue');
        if (blankItem.id) {
            blankItem.removeAttribute('id');
        }

        // Update the href (the item itself might be an <a>, or contain one)
        if (blankItem.tagName === 'A') {
            blankItem.href = blankUrl;
        } else {
            const link = blankItem.querySelector('a');
            if (link) {
                link.href = blankUrl;
            }
        }

        // Ensure clicks navigate directly to the blank issue page
        // This prevents overlay event delegation from intercepting the click
        blankItem.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = blankUrl;
        });

        // Update the title text
        // Try semantic elements first, then fall back to first text-bearing span
        let titleEl = blankItem.querySelector('strong, b, h3, h4');
        if (!titleEl) {
            // In Primer React dialogs, titles are styled spans.
            // Find the first leaf element with text content.
            const allEls = Array.from(blankItem.querySelectorAll('*'));
            titleEl = _.find(allEls, el => el.children.length === 0 && el.textContent.trim().length > 2);
        }
        if (titleEl) {
            titleEl.textContent = 'Blank issue';
        }

        // Update the description (first text-only element after the title)
        const allEls = Array.from(blankItem.querySelectorAll('*'));
        const titleIdx = _.indexOf(allEls, titleEl);
        const descEl = _.find(allEls, (el, idx) => idx > titleIdx && el.children.length === 0 && el.textContent.trim() && !el.contains(titleEl));
        if (descEl) {
            descEl.textContent = 'Create an issue without using a template';
        }

        container.insertBefore(blankItem, container.firstChild);
    }

    /**
     * Apply all enhancements: sort, blank issue button, and search box
     *
     * @returns {boolean} Whether enhancements were successfully applied
     */
    function enhance() {
        // Guard: don't run twice
        if (document.querySelector('.k2-template-search')) {
            return true;
        }

        const result = findTemplateList();
        if (!result) {
            return false;
        }

        const {container, items} = result;

        // 1. Sort items alphabetically by title
        const sorted = _.sortBy(items, item => getItemTitle(item).toLowerCase());
        _.each(sorted, item => container.appendChild(item));

        // 2. Add a "Blank issue" link at the top
        addBlankIssueButton(container);

        // 3. Add search/filter box
        addSearchBox(container, items);

        return true;
    }

    /**
     * Check if we're on the /issues page (not /issues/new/choose)
     *
     * @returns {boolean}
     */
    function isIssuesListPage() {
        return /^\/[\w-]+\/[\w-.]+\/issues\/?$/.test(window.location.pathname);
    }

    IssueChoosePage.setup = function () {
        if (isIssuesListPage()) {
            // On the /issues page, the template chooser appears as a dialog overlay
            // when "New Issue" is clicked. Use a MutationObserver to detect it.
            const observer = new MutationObserver(() => {
                // Only try enhancing when a dialog is visible and not already enhanced
                if (!document.querySelector('dialog, [role="dialog"]')) {
                    return;
                }
                enhance();
            });

            observer.observe(document.body, {childList: true, subtree: true});
            return;
        }

        // On /issues/new/choose, poll until the template list is rendered
        let attempts = 0;
        const maxAttempts = 30;

        const tryEnhance = () => {
            if (attempts >= maxAttempts) {
                return;
            }
            attempts++;

            if (!enhance()) {
                setTimeout(tryEnhance, 300);
            }
        };

        // Start trying after a short delay to let the page render
        setTimeout(tryEnhance, 200);
    };

    return IssueChoosePage;
}
