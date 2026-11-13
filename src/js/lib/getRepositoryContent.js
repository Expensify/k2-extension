/**
 * Find the repository content area across GitHub layouts.
 * @returns {Element|null}
 */
export default function getRepositoryContent() {
    return document.querySelector('.repository-content') || document.getElementById('ui-service-main-content');
}
