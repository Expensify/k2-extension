import $ from 'jquery';
import React from 'react';
import {createRoot} from 'react-dom/client';
import ReactNativeOnyx from 'react-native-onyx';
import ListIssues from './ListIssues';
import FormPassword from './FormPassword';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';
import * as GitHubOAuth from '../../lib/GitHubOAuth';

/**
 * Display our dashboard with the list of issues
 */
function showDashboard() {
    // Clean up password form
    $('.repository-content').children('.passwordform').remove();

    if (!$('.repository-content').children('.k2dashboard').length) {
        $('.repository-content').append('<div class="k2dashboard">');
    }

    const root = createRoot($('.k2dashboard').show()[0]);
    root.render(<ListIssues pollInterval={60000} />);
}

/**
 * Prompt them for their password, then show the dashboard
 *
 * @date 2015-06-14
 */
function showPasswordForm() {
    // Clean up dashboard
    $('.repository-content').children('.k2dashboard').remove();

    if (!$('.repository-content').children('.passwordform').length) {
        $('.repository-content').append('<div class="passwordform k2-passwordform">');
    }

    $('.repository-content').children('.passwordform').addClass('k2-passwordform');

    const root = createRoot($('.passwordform').show()[0]);
    root.render(<FormPassword onFinished={showDashboard} />);
}

/**
 * Check authentication status and show appropriate interface
 * @param {Object} preferences - User preferences from Onyx, potentially containing legacy credentials
 */
async function checkAuthAndShowInterface(preferences) {
    let legacyAuth = null;
    if (preferences && preferences.auth) {
        legacyAuth = preferences.auth;
    } else if (preferences && preferences.ghToken) {
        legacyAuth = {type: 'pat', token: preferences.ghToken};
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

export default () => ({
    draw() {
        const passwordFormWasDrawn = $('.repository-content').children('.passwordform').length;
        const dashboardWasDrawn = $('.repository-content').children('.k2dashboard').length;

        if (passwordFormWasDrawn || dashboardWasDrawn) {
            return;
        }
        $('.repository-content').children().remove();
        ReactNativeOnyx.init({
            keys: ONYXKEYS,
        });

        // Connect to preferences store
        ReactNativeOnyx.connect({
            key: ONYXKEYS.PREFERENCES,
            callback: (newPreferences) => {
                checkAuthAndShowInterface(newPreferences).catch((error) => {
                    // eslint-disable-next-line no-console
                    console.error('Unable to check GitHub authentication', error);
                    showPasswordForm();
                });
            },
        });
    },
});
