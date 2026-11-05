import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import ListIssues from './ListIssues';
import FormPassword from './FormPassword';
import ONYXKEYS from '../../ONYXKEYS';
import renderPrimerRoot from '../../lib/renderPrimerRoot';
import registerDashboardRefresh from './refreshDashboard';
import DashboardErrorBoundary from '../../component/DashboardErrorBoundary';

const HOST_CLASS = 'k2-dashboard-host';

// The element K2 renders into and its React root, shared by the dashboard and the password form
let host = null;

let preferences = null;
let isConnectedToPreferences = false;

/**
 * Get the element of the repository page that holds the K2 dashboard. Classic repository pages use
 * `.repository-content`, while pages rendered by GitHub's React shell put everything below the
 * repository tabs in `#ui-service-main-content`.
 *
 * @returns {HTMLElement|null}
 */
function getDashboardParent() {
    return document.getElementById('ui-service-main-content') || document.querySelector('.repository-content');
}

/**
 * Get the React root for the K2 host element, creating the host when it is not in the page
 *
 * @returns {Object|null}
 */
function getRoot() {
    if (host && host.isConnected) {
        return host;
    }

    const parent = getDashboardParent();
    if (!parent) {
        console.error('K2: could not find the repository content container to render the dashboard into');
        return null;
    }

    // Keep GitHub's content and hydration data intact; CSS hides the host's siblings while K2 is active.
    host = document.createElement('div');
    parent.appendChild(host);
    return host;
}

/**
 * Display our dashboard with the list of issues
 */
function showDashboard() {
    const dashboardHost = getRoot();
    if (!dashboardHost) {
        return;
    }
    dashboardHost.className = `${HOST_CLASS} k2dashboard`;
    renderPrimerRoot(
        dashboardHost,
        <DashboardErrorBoundary>
            <ListIssues pollInterval={60000} />
        </DashboardErrorBoundary>,
    );
}

/**
 * Prompt them for their password, then show the dashboard
 *
 * @date 2015-06-14
 */
function showPasswordForm() {
    const formHost = getRoot();
    if (!formHost) {
        return;
    }
    formHost.className = `${HOST_CLASS} passwordform k2-passwordform`;
    renderPrimerRoot(formHost, <FormPassword onFinished={showDashboard} />);
}

/**
 * Check authentication status and show appropriate interface
 */
function checkAuthAndShowInterface() {
    // Check if user is authenticated with either PAT or OAuth
    const hasPatAuth = preferences && preferences.ghToken;
    const hasOAuthAuth = preferences && preferences.auth && preferences.auth.type === 'oauth' && preferences.auth.token;

    if (!hasPatAuth && !hasOAuthAuth) {
        showPasswordForm();
        return;
    }

    showDashboard();
}

export {getDashboardParent};

export default () => ({
    draw() {
        if (host && host.isConnected) {
            return;
        }

        if (isConnectedToPreferences) {
            checkAuthAndShowInterface();
            return;
        }

        isConnectedToPreferences = true;
        ReactNativeOnyx.init({
            keys: ONYXKEYS,
        });
        registerDashboardRefresh();

        // Connect to preferences store
        ReactNativeOnyx.connect({
            key: ONYXKEYS.PREFERENCES,
            callback: (newPreferences) => {
                preferences = newPreferences;
                checkAuthAndShowInterface();
            },
        });
    },
});
