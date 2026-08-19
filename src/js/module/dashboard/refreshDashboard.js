import * as Issues from '../../lib/actions/Issues';
import * as PullRequests from '../../lib/actions/PullRequests';

let isRegistered = false;
let resumeTimeout;

function isDashboardVisible() {
    return document.visibilityState === 'visible' && window.location.hash.indexOf('#k2') === 0;
}

function refreshIfVisible(refresh) {
    if (!isDashboardVisible()) {
        return;
    }
    refresh();
}

function refreshDashboard() {
    if (!isDashboardVisible()) {
        return;
    }

    const repositoryContent = document.querySelector('.repository-content');
    if (!repositoryContent) {
        return;
    }
    if (!repositoryContent.querySelector('.k2dashboard')) {
        window.dispatchEvent(new Event('hashchange'));
        return;
    }

    Issues.getAllAssigned();
    Issues.getHotPicks();
    setTimeout(() => refreshIfVisible(PullRequests.getReviewing), 500);
    setTimeout(() => refreshIfVisible(PullRequests.getAssigned), 1000);
}

function scheduleDashboardRefresh() {
    clearTimeout(resumeTimeout);
    resumeTimeout = setTimeout(refreshDashboard, 100);
}

export default function registerDashboardRefresh() {
    if (isRegistered) {
        return;
    }
    isRegistered = true;

    document.addEventListener('visibilitychange', scheduleDashboardRefresh);
    window.addEventListener('focus', scheduleDashboardRefresh);
    window.addEventListener('pageshow', scheduleDashboardRefresh);
}
