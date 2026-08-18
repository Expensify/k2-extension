import * as Issues from '../../lib/actions/Issues';
import * as PullRequests from '../../lib/actions/PullRequests';

let isRegistered = false;

function refreshDashboard() {
    if (document.visibilityState !== 'visible' || window.location.hash.indexOf('#k2') !== 0) {
        return;
    }

    Issues.getAllAssigned();
    Issues.getHotPicks();
    PullRequests.getReviewing();
    PullRequests.getAssigned();
}

export default function registerDashboardRefresh() {
    if (isRegistered) {
        return;
    }
    isRegistered = true;

    document.addEventListener('visibilitychange', refreshDashboard);
    window.addEventListener('focus', refreshDashboard);
    window.addEventListener('pageshow', refreshDashboard);
}
