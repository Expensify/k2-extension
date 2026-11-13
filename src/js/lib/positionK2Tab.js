import k2Button from '../template/button.github.k2.html';

/**
 * Position K2 alongside GitHub's repository tabs.
 * @returns {boolean} Whether the repository navigation is available
 */
export default function positionK2Tab() {
    const pullsTab = document.querySelector('nav[aria-label="Repository"] a[href*="/pulls"]');
    let k2Tab = document.querySelector('li.k2-extension');

    if (!pullsTab) {
        if (k2Tab) {
            k2Tab.style.display = 'none';
        }
        return false;
    }

    if (!k2Tab) {
        // Keep K2 outside GitHub's managed list to preserve search behavior.
        document.body.insertAdjacentHTML('beforeend', k2Button({url: '/Expensify/Expensify'}));
        k2Tab = document.querySelector('li.k2-extension');
    }

    // Use document coordinates so K2 scrolls and bounces with GitHub's tab list.
    const rectangle = pullsTab.getBoundingClientRect();
    k2Tab.style.display = 'flex';
    k2Tab.style.position = 'absolute';
    k2Tab.style.top = `${rectangle.top + window.scrollY}px`;
    k2Tab.style.left = `${rectangle.right + window.scrollX + 8}px`;
    k2Tab.style.height = `${rectangle.height}px`;
    k2Tab.style.zIndex = '1000';

    return true;
}
