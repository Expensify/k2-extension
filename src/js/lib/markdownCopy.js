import _ from 'underscore';
import TurndownService from 'turndown';

// ---------------------------------------------------------------------------
// CONFIG: Turndown Service
// ---------------------------------------------------------------------------
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
});

// RULE 1: GitHub Task List Checkboxes
turndownService.addRule('githubTaskList', {
    filter(node) {
        return node.nodeName === 'LI'
            && (node.classList.contains('task-list-item') || node.querySelector('input.task-list-item-checkbox'));
    },
    replacement(content, node) {
        const checkbox = node.querySelector('input[type="checkbox"]');
        const isChecked = checkbox && checkbox.checked;
        const cleanContent = content.trim();
        return `${isChecked ? '- [x] ' : '- [ ] '}${cleanContent}\n`;
    },
});

// RULE 2: GitHub Syntax-Highlighted Code Blocks
turndownService.addRule('githubCodeBlocks', {
    filter(node) {
        return node.nodeName === 'DIV' && node.classList.contains('highlight');
    },
    replacement(content, node) {
        const langMatch = (node.className || '').match(/highlight-source-([a-z0-9]+)/);
        const lang = langMatch ? langMatch[1] : '';
        return `\n\n\`\`\`${lang}\n${node.textContent.trim()}\n\`\`\`\n\n`;
    },
});

// ---------------------------------------------------------------------------
// HELPER: Find Comment Body Elements
// ---------------------------------------------------------------------------

/**
 * Finds the closest comment body element by geometric proximity to a trigger button
 * @param {HTMLElement} triggerBtn - The button that triggered the action
 * @returns {HTMLElement|null} - The closest comment body element
 */
function findClosestCommentBody(triggerBtn) {
    const candidates = document.querySelectorAll('.markdown-body, [data-testid="markdown-body"], .comment-body');
    const btnRect = triggerBtn.getBoundingClientRect();
    const btnY = btnRect.top + (btnRect.height / 2);

    let closestElement = null;
    let minDistance = Infinity;

    _.each(candidates, (el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            return;
        }

        const elY = rect.top;
        const distance = Math.abs(elY - btnY);

        if (distance < minDistance) {
            minDistance = distance;
            closestElement = el;
        }
    });

    return closestElement;
}

/**
 * Finds the comment body element from a menu node by traversing up to the container
 * @param {HTMLElement} node - The menu node
 * @returns {HTMLElement|null} - The comment body element
 */
function findCommentBodyFromNode(node) {
    const container = node.closest('.js-comment-container, .TimelineItem, .ReviewComment, .Box, .timeline-comment');
    if (!container) {
        return null;
    }
    return container.querySelector('.markdown-body, .comment-body');
}

// ---------------------------------------------------------------------------
// HELPER: Perform Copy Action
// ---------------------------------------------------------------------------

/**
 * Copies the markdown content of a comment to the clipboard
 * @param {HTMLElement} bodyElement - The comment body element
 * @param {HTMLElement} menuToClose - The menu element to close after copying
 */
async function performCopy(bodyElement, menuToClose) {
    if (!bodyElement) {
        // eslint-disable-next-line no-alert
        alert('Could not locate comment text nearby.');
        return;
    }

    try {
        const markdown = turndownService.turndown(bodyElement.innerHTML);
        await navigator.clipboard.writeText(markdown);

        // Flash the comment body to indicate success
        const element = bodyElement;
        const originalBg = element.style.backgroundColor;
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = '#aafdbcaa';
        setTimeout(() => {
            element.style.backgroundColor = originalBg;
        }, 300);

        // Close the menu
        const overlay = menuToClose.closest('[data-component="AnchoredOverlay"]');
        if (overlay) {
            overlay.remove();
        }
        const details = menuToClose.closest('details');
        if (details) {
            details.removeAttribute('open');
        }
    } catch (err) {
        console.error('Copy failed', err);
    }
}

// ---------------------------------------------------------------------------
// MENU HANDLERS
// ---------------------------------------------------------------------------

/**
 * Adds "Copy as markdown" button to Issue comment menus (ul[role="menu"])
 * @param {HTMLElement} menuList - The menu list element
 */
function handleIssueMenu(menuList) {
    if (!menuList.innerText.includes('Copy link')) {
        return;
    }

    const refItem = _.find(menuList.children, li => li.innerText.includes('Copy link'));
    if (!refItem) {
        return;
    }

    const newItem = refItem.cloneNode(true);
    newItem.classList.add('custom-markdown-copy');
    newItem.removeAttribute('id');
    const label = newItem.querySelector('.prc-ActionList-ItemLabel-81ohH') || newItem.querySelector('span');
    if (label) {
        label.innerText = 'Copy as markdown';
    }

    const iconContainer = newItem.querySelector('.prc-ActionList-VisualWrap-bdCsS');
    if (iconContainer) {
        // Copy icon SVG
        const copyIconPath1 = 'M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0';
        const copyIconPath1b = ' .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75';
        const copyIconPath1c = ' 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z';
        const copyIconPath2 = 'M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1';
        const copyIconPath2b = ' 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0';
        const copyIconPath2c = ' .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z';
        const fullPath1 = copyIconPath1 + copyIconPath1b + copyIconPath1c;
        const fullPath2 = copyIconPath2 + copyIconPath2b + copyIconPath2c;
        // eslint-disable-next-line prefer-template
        iconContainer.innerHTML = '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" '
            + 'fill="currentColor" class="octicon"><path d="' + fullPath1 + '"></path>'
            + '<path d="' + fullPath2 + '"></path></svg>';
    }

    refItem.after(newItem);

    newItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const triggerBtn = document.querySelector('button[aria-expanded="true"]');
        if (triggerBtn) {
            const bodyElement = findClosestCommentBody(triggerBtn);
            performCopy(bodyElement, menuList);
        } else {
            // eslint-disable-next-line no-alert
            alert('Could not locate the active menu button.');
        }
    });
}

/**
 * Adds "Copy as markdown" button to PR comment menus (details-menu)
 * @param {HTMLElement} menuList - The menu list element
 */
function handlePrMenu(menuList) {
    if (menuList.querySelector('.custom-markdown-copy')) {
        return;
    }

    // Wait for at least "Copy link" to exist (it works for both logged in and out)
    const copyLinkBtn = menuList.querySelector('clipboard-copy');
    if (!copyLinkBtn && !menuList.querySelector('.js-comment-quote-reply')) {
        return;
    }

    const newItem = document.createElement('button');
    newItem.className = 'dropdown-item btn-link custom-markdown-copy';
    newItem.setAttribute('role', 'menuitem');
    newItem.setAttribute('type', 'button');
    newItem.innerText = 'Copy as markdown';

    // INSERTION LOGIC
    const quoteReplyBtn = menuList.querySelector('.js-comment-quote-reply');

    if (quoteReplyBtn) {
        // 1. Logged In: Insert BETWEEN "Copy Link" and "Quote"
        quoteReplyBtn.before(newItem);
    } else if (copyLinkBtn) {
        // 2. Logged Out: Insert AFTER "Copy Link"
        // Note: Sometimes <clipboard-copy> is wrapped in a <span>. We must insert after the wrapper.
        const container = copyLinkBtn.closest('span[data-view-component="true"]') || copyLinkBtn;
        container.after(newItem);
    } else {
        // 3. Fallback: Append to bottom
        menuList.append(newItem);
    }

    newItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const bodyElement = findCommentBodyFromNode(menuList);
        performCopy(bodyElement, menuList);
    });
}

/**
 * Process a single mutation for the MutationObserver
 * @param {MutationRecord} mutation - The mutation record to process
 */
function processMutation(mutation) {
    // CASE A: Lazy Loading (Items added to existing menu)
    if (mutation.target.tagName === 'DETAILS-MENU') {
        if (!mutation.target.querySelector('.custom-markdown-copy')) {
            handlePrMenu(mutation.target);
        }
    }

    // CASE B: New Menus appearing in DOM
    if (!mutation.addedNodes.length) {
        return;
    }

    // Issue Menus (Overlay)
    const ulMenu = document.querySelector('ul[role="menu"]');
    if (ulMenu && !ulMenu.querySelector('.custom-markdown-copy')) {
        handleIssueMenu(ulMenu);
    }

    // PR Menus (New <details-menu>)
    _.each(mutation.addedNodes, (node) => {
        if (node.tagName === 'DETAILS-MENU') {
            if (!node.querySelector('.custom-markdown-copy')) {
                handlePrMenu(node);
            }
        }
        if (!node.querySelectorAll) {
            return;
        }
        _.each(node.querySelectorAll('details-menu'), (dm) => {
            if (dm.querySelector('.custom-markdown-copy')) {
                return;
            }
            handlePrMenu(dm);
        });
    });
}

// ---------------------------------------------------------------------------
// OBSERVER & INITIALIZATION
// ---------------------------------------------------------------------------

/**
 * Initializes static menus that may already exist on page load (SSR pages)
 */
function initStaticMenus() {
    setTimeout(() => {
        const menus = document.querySelectorAll('details-menu');
        _.each(menus, handlePrMenu);
    }, 100);
}

/**
 * Sets up a MutationObserver to watch for dynamically added menus
 */
function setupMarkdownCopyObserver() {
    const observer = new MutationObserver((mutations) => {
        _.each(mutations, processMutation);
    });

    observer.observe(document.body, {childList: true, subtree: true});
}

/**
 * Main initialization function - call this to enable the markdown copy feature
 */
function initMarkdownCopy() {
    initStaticMenus();
    setupMarkdownCopyObserver();
}

export {
    initMarkdownCopy,
    handlePrMenu,
    handleIssueMenu,
    setupMarkdownCopyObserver,
    initStaticMenus,
};
