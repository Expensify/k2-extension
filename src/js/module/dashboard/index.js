import React from 'react';
import {createRoot} from 'react-dom/client';
import ReactNativeOnyx from 'react-native-onyx';
import ListIssues from './ListIssues';
import FormPassword from './FormPassword';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';
import * as GitHubOAuth from '../../lib/GitHubOAuth';

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
    return document.getElementById('ui-service-main-content') || document.querySelector('.repository-content');
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

    // Keep GitHub's content and hydration data intact; CSS hides the host's siblings while K2 is active.
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
 * @param {Object} currentPreferences - User preferences from Onyx, potentially containing legacy credentials
 */
async function checkAuthAndShowInterface(currentPreferences) {
    let legacyAuth = null;
    if (currentPreferences && currentPreferences.auth) {
        legacyAuth = currentPreferences.auth;
    } else if (currentPreferences && currentPreferences.ghToken) {
        legacyAuth = {type: 'pat', token: currentPreferences.ghToken};
    }
    const migration = await GitHubOAuth.migrateLegacyAuth(legacyAuth);
    if (migration.migrated) {
        Preferences.clearLegacyGitHubAuth();
    }
    if (!migration.authenticated) {
        showPasswordForm();
        return;
    }

    showDashboard();
}

function updateInterface() {
    checkAuthAndShowInterface(preferences).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Unable to check GitHub authentication', error);
        showPasswordForm();
    });
}

export {getDashboardParent};

export default () => ({
    draw() {
        if (host && host.isConnected) {
            return;
        }

        if (isConnectedToPreferences) {
            updateInterface();
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
                updateInterface();
            },
        });
    },
});
