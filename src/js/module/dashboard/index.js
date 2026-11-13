import $ from 'jquery';
import React from 'react';
import {createRoot} from 'react-dom/client';
import ReactNativeOnyx from 'react-native-onyx';
import ListIssues from './ListIssues';
import FormPassword from './FormPassword';
import ONYXKEYS from '../../ONYXKEYS';
import getRepositoryContent from '../../lib/getRepositoryContent';

/**
 * Display our dashboard with the list of issues
 */
function showDashboard() {
    const repositoryContent = $(getRepositoryContent());

    // Clean up password form
    repositoryContent.children('.passwordform').remove();

    if (!repositoryContent.children('.k2dashboard').length) {
        repositoryContent.append('<div class="k2dashboard">');
    }

    const root = createRoot(repositoryContent.children('.k2dashboard').show()[0]);
    root.render(<ListIssues pollInterval={60000} />);
}

/**
 * Prompt them for their password, then show the dashboard
 *
 * @date 2015-06-14
 */
function showPasswordForm() {
    const repositoryContent = $(getRepositoryContent());

    // Clean up dashboard
    repositoryContent.children('.k2dashboard').remove();

    if (!repositoryContent.children('.passwordform').length) {
        repositoryContent.append('<div class="passwordform k2-passwordform">');
    }

    repositoryContent.children('.passwordform').addClass('k2-passwordform');

    const root = createRoot(repositoryContent.children('.passwordform').show()[0]);
    root.render(<FormPassword onFinished={showDashboard} />);
}

/**
 * Check authentication status and show appropriate interface
 * @param {Object} preferences - User preferences from Onyx (contains ghToken and auth)
 */
function checkAuthAndShowInterface(preferences) {
    // Check if user is authenticated with either PAT or OAuth
    const hasPatAuth = preferences && preferences.ghToken;
    const hasOAuthAuth = preferences && preferences.auth && preferences.auth.type === 'oauth' && preferences.auth.token;

    if (!hasPatAuth && !hasOAuthAuth) {
        showPasswordForm();
        return;
    }

    showDashboard();
}

export default () => ({
    draw() {
        const repositoryContent = $(getRepositoryContent());
        const passwordFormWasDrawn = repositoryContent.children('.passwordform').length;
        const dashboardWasDrawn = repositoryContent.children('.k2dashboard').length;

        if (passwordFormWasDrawn || dashboardWasDrawn) {
            return;
        }
        repositoryContent.children().remove();
        ReactNativeOnyx.init({
            keys: ONYXKEYS,
        });

        let preferences = null;

        // Connect to preferences store
        ReactNativeOnyx.connect({
            key: ONYXKEYS.PREFERENCES,
            callback: (newPreferences) => {
                preferences = newPreferences;
                checkAuthAndShowInterface(preferences);
            },
        });
    },
});
