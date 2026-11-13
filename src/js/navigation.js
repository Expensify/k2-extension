import positionK2Tab from './lib/positionK2Tab';

// Add K2 as soon as GitHub's tabs are parsed, before the main extension bundle runs.
const observer = new MutationObserver(() => {
    if (!positionK2Tab()) {
        return;
    }
    observer.disconnect();
});

observer.observe(document, {childList: true, subtree: true});

if (positionK2Tab()) {
    observer.disconnect();
}

document.addEventListener('DOMContentLoaded', () => observer.disconnect(), {once: true});
