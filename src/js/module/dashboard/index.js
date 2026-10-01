import $ from 'jquery';
import React from 'react';
import {createRoot} from 'react-dom/client';
import ReactNativeOnyx from 'react-native-onyx';
import ListIssues from './ListIssues';
import FormPassword from './FormPassword';
import ONYXKEYS from '../../ONYXKEYS';

const HOST_CLASS = 'k2-dashboard-host';

// The element K2 renders into and its React root, shared by the dashboard and the password form
let host = null;
let root = null;

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
    return document.querySelector('.repository-content') || document.getElementById('ui-service-main-content');
}

/**
 * Get the React root for the K2 host element, creating the host when it is not in the page
 *
 * @returns {Object|null}
 */
function getRoot() {
    if (host && host.isConnected) {
        return root;
    }

    const parent = getDashboardParent();
    if (!parent) {
        console.error('K2: could not find the repository content container to render the dashboard into');
        return null;
    }

    if (root) {
        root.unmount();
    }

    // The classic container is server-rendered, so its content is replaced. React-rendered content is hidden with CSS
    // instead, because removing nodes that GitHub's React app manages breaks it.
    if (parent.matches('.repository-content')) {
        $(parent).children().remove();
    }

    host = document.createElement('div');
    parent.appendChild(host);
    root = createRoot(host);
    return root;
}

/**
 * Display our dashboard with the list of issues
 */
function showDashboard() {
    const dashboardRoot = getRoot();
    if (!dashboardRoot) {
        return;
    }
    host.className = `${HOST_CLASS} k2dashboard`;
    dashboardRoot.render(<ListIssues pollInterval={60000} />);
}

/**
 * Prompt them for their password, then show the dashboard
 *
 * @date 2015-06-14
 */
function showPasswordForm() {
    const formRoot = getRoot();
    if (!formRoot) {
        return;
    }
    host.className = `${HOST_CLASS} passwordform k2-passwordform`;
    formRoot.render(<FormPassword onFinished={showDashboard} />);
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
