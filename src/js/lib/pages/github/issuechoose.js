import _ from 'underscore';
import Base from './_base';

/**
 * This page handler enhances the issue template chooser at /issues/new/choose.
 * It adds:
 * 1. Alphabetical sorting of templates
 * 2. A "Blank issue" button at the top of the list
 * 3. A search/filter box to quickly find templates
 *
 * @returns {Object}
 */
export default function () {
    const IssueChoosePage = new Base();

    IssueChoosePage.urlPath = '^(/[\\w-]+/[\\w-.]+/issues/new/choose)';

    /**
     * Get the title text of a template item for sorting and filtering
     *
     * @param {Element} element - A template list item element
     * @returns {string} The title text
     */
    function getItemTitle(element) {
        const titleEl = element.querySelector('strong, b, h3, h4');
        if (titleEl) {
            return titleEl.textContent.trim();
        }
        return element.textContent.trim().split('\n')[0].trim();
    }

    /**
     * Find the container element that holds all template items.
     * Works by finding template links and determining their common parent.
     *
     * @returns {{container: Element, items: Element[]} | null}
     */
    function findTemplateList() {
        // Find links pointing to issue creation with templates
        // These have hrefs like /owner/repo/issues/new?template=something
        const links = Array.from(document.querySelectorAll('a[href*="/issues/new"]'));
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        const templateLinks = _.filter(links, (link) => {
            const href = link.getAttribute('href') || '';
            return href.includes('/issues/new?') || /\/issues\/new\/[^c][^h]/.test(href);
        });

        if (templateLinks.length < 2) {
            return null;
        }

        // Walk up the DOM from the first link to find a container whose direct
        // children correspond to the template items
        let container = null;
        let items = [];

        // Collect all ancestor candidates first, then test them
        const candidates = [];
        let node = templateLinks[0].parentElement;
        while (node && node !== document.body) {
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

        // Update the title text
        const titleEl = blankItem.querySelector('strong, b, h3, h4');
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

    IssueChoosePage.setup = function () {
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
