import * as ManualRequestUsers from '../../lib/actions/ManualRequestUsers';

const INJECTED_MARKER = 'k2-hovercard-payment';

const EXPENSIFY_LOGO_URL = 'https://raw.githubusercontent.com/'
    + 'Expensify/App/main/assets/images/expensify-logo-round.png';

const UPWORK_LOGO_URL = 'https://upload.wikimedia.org/'
    + 'wikipedia/commons/d/d2/Upwork-logo.svg';

// Octicon briefcase path for the contractor icon
const BRIEFCASE_D = 'M7.5 1.75C7.5.784 8.284 0 9.25 0h5.5c.966 0 1.75.784'
    + ' 1.75 1.75V4h4.25a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5H5V1.75Z'
    + 'M9 1.75V4h6V1.75a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25Z'
    + 'M1.75 7h20.5v12.25A2.75 2.75 0 0 1 19.5 22h-15A2.75 2.75 0 0 1'
    + ' 1.75 19.25V7Z';

const CATEGORY_CONFIG = {
    'manual-request': {
        label: 'Paid via New Expensify',
        iconType: 'img',
        iconSrc: EXPENSIFY_LOGO_URL,
        iconRound: true,
    },
    contractor: {
        label: 'Contractor (does not require payment)',
        iconType: 'svg',
        iconPath: BRIEFCASE_D,
        viewBox: '0 0 24 24',
    },
    upwork: {
        label: 'Paid via Upwork',
        iconType: 'img',
        iconSrc: UPWORK_LOGO_URL,
    },
};

/**
 * Extract the GitHub username from a hovercard popover.
 * Tries the trigger element first, then falls back to parsing the card content.
 *
 * @param {HTMLElement} popover
 * @returns {String|null}
 */
function extractUsername(popover) {
    // Strategy 1: find the trigger element that opened this hovercard.
    // GitHub marks triggers with data-hovercard-url="/users/<username>/hovercard"
    const trigger = document.querySelector('[data-hovercard-type="user"][aria-describedby]');
    if (trigger) {
        const url = trigger.getAttribute('data-hovercard-url') || '';
        const match = url.match(/\/users\/([^/]+)\/hovercard/);
        if (match) {
            return match[1];
        }
    }

    // Strategy 2: look for a profile link inside the popover itself
    const profileLink = popover.querySelector('a[data-hovercard-type="user"]')
        || popover.querySelector('a[href^="/"][class*="Link"]');
    if (profileLink) {
        const href = profileLink.getAttribute('href') || '';
        const segments = href.replace(/^\//, '').split('/');
        if (segments.length === 1 && segments[0]) {
            return segments[0];
        }
    }

    // Strategy 3: the bold username text at the top of the card
    const boldEl = popover.querySelector('strong, [class*="text-bold"], .wb-break-word');
    if (boldEl && boldEl.textContent.trim().match(/^[a-zA-Z0-9_-]+$/)) {
        return boldEl.textContent.trim();
    }

    return null;
}

/**
 * Build the icon element for a given category config.
 *
 * @param {Object} cfg - entry from CATEGORY_CONFIG
 * @returns {HTMLElement}
 */
function buildIcon(cfg) {
    if (cfg.iconType === 'img') {
        const img = document.createElement('img');
        img.src = cfg.iconSrc;
        img.height = 16;
        img.className = 'mr-1';
        if (cfg.iconRound) {
            img.width = 16;
            img.style.borderRadius = '50%';
        }
        return img;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('height', '16');
    svg.setAttribute('width', '16');
    svg.setAttribute('viewBox', cfg.viewBox || '0 0 16 16');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('class', 'octicon mr-1');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', cfg.iconPath);
    svg.appendChild(path);
    return svg;
}

/**
 * Inject the payment-method indicator into a hovercard popover element.
 *
 * @param {HTMLElement} popover
 */
function injectPaymentInfo(popover) {
    if (!popover) {
        return;
    }

    if (popover.querySelector(`.${INJECTED_MARKER}`)) {
        return;
    }

    const username = extractUsername(popover);
    if (!username) {
        return;
    }

    if (!ManualRequestUsers.isLoaded()) {
        ManualRequestUsers.fetchManualRequestUsers().then(() => injectPaymentInfo(popover));
        return;
    }

    const category = ManualRequestUsers.getPaymentCategory(username);

    // Employees and bots get no indicator
    if (!category || category === 'employee' || category === 'bot') {
        return;
    }

    const cfg = CATEGORY_CONFIG[category];
    if (!cfg) {
        return;
    }

    const indicator = document.createElement('div');
    indicator.className = `${INJECTED_MARKER} mt-2 text-small d-flex flex-items-center`;

    indicator.appendChild(buildIcon(cfg));

    const label = document.createElement('span');
    label.textContent = cfg.label;
    indicator.appendChild(label);

    // Insert at the bottom of the card body
    const cardBody = popover.querySelector('.d-flex.flex-column')
        || popover.querySelector('[class*="Popover-message"]')
        || popover;

    const rows = cardBody.querySelectorAll('[class*="mt-"], .border-top');
    if (rows.length) {
        rows[rows.length - 1].after(indicator);
    } else {
        cardBody.appendChild(indicator);
    }
}

/**
 * Process a single added node looking for GitHub hovercard popovers.
 *
 * @param {Node} node
 */
function processNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    // GitHub renders hovercards inside .Popover containers
    const popover = node.classList && node.classList.contains('Popover')
        ? node
        : node.querySelector && node.querySelector('.Popover');

    if (popover) {
        setTimeout(() => injectPaymentInfo(popover), 100);
    }

    // Handle content injected into an existing .Popover
    if (node.closest) {
        const closestPopover = node.closest('.Popover');
        if (closestPopover) {
            setTimeout(() => injectPaymentInfo(closestPopover), 100);
        }
    }
}

/**
 * Process mutations looking for GitHub hovercard popovers being added or populated.
 *
 * @param {MutationRecord} mutation
 */
function processMutation(mutation) {
    if (!mutation.addedNodes || !mutation.addedNodes.length) {
        return;
    }

    for (let i = 0; i < mutation.addedNodes.length; i++) {
        processNode(mutation.addedNodes[i]);
    }
}

let observer;

export default {
    draw() {
        if (observer) {
            return;
        }

        observer = new MutationObserver((mutations) => {
            for (let i = 0; i < mutations.length; i++) {
                processMutation(mutations[i]);
            }
        });

        observer.observe(document.body, {childList: true, subtree: true});
    },
};
