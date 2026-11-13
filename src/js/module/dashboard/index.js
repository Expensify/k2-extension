import $ from 'jquery';
import React from 'react';
import {createRoot} from 'react-dom/client';
import ReactNativeOnyx from 'react-native-onyx';
import ListIssues from './ListIssues';
import FormPassword from './FormPassword';
import ONYXKEYS from '../../ONYXKEYS';
import getRepositoryContent from '../../lib/getRepositoryContent';

let preferences;
let preferencesLoaded = false;
let preferencesConnected = false;
let root;
let rootElement;

/**
 * Release the previous view when GitHub replaces its content container.
 * @param {Element} element
 * @param {React.ReactNode} component
 */
function renderInterface(element, component) {
    if (rootElement !== element) {
        if (root) {
            root.unmount();
        }
        root = createRoot(element);
        rootElement = element;
    }
    root.render(component);
}

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

    renderInterface(repositoryContent.children('.k2dashboard').show()[0], <ListIssues pollInterval={60000} />);
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

    renderInterface(repositoryContent.children('.passwordform').show()[0], <FormPassword onFinished={showDashboard} />);
}

/**
 * Check authentication status and show appropriate interface
 * @param {Object} currentPreferences User preferences from Onyx
 */
function checkAuthAndShowInterface(currentPreferences) {
    if (window.location.hash.indexOf('#k2') !== 0 || !getRepositoryContent()) {
        return;
    }

    // Check if user is authenticated with either PAT or OAuth
    const hasPatAuth = currentPreferences && currentPreferences.ghToken;
    const hasOAuthAuth = currentPreferences && currentPreferences.auth && currentPreferences.auth.type === 'oauth' && currentPreferences.auth.token;

    if (!hasPatAuth && !hasOAuthAuth) {
        showPasswordForm();
        return;
    }

    showDashboard();
}

export default () => ({
    draw() {
        const repositoryContent = $(getRepositoryContent());
        if (!repositoryContent.length) {
            return;
        }

        const passwordFormWasDrawn = repositoryContent.children('.passwordform').length;
        const dashboardWasDrawn = repositoryContent.children('.k2dashboard').length;

        if (passwordFormWasDrawn || dashboardWasDrawn) {
            return;
        }
        repositoryContent.children().remove();

        if (preferencesLoaded) {
            checkAuthAndShowInterface(preferences);
            return;
        }

        if (preferencesConnected) {
            return;
        }
        preferencesConnected = true;

        // Connect to preferences store
        ReactNativeOnyx.connect({
            key: ONYXKEYS.PREFERENCES,
            callback: (newPreferences) => {
                preferences = newPreferences;
                preferencesLoaded = true;
                checkAuthAndShowInterface(preferences);
            },
        });
    },
});
