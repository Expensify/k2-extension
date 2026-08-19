import $ from 'jquery';
import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import ListIssues from './ListIssues';
import FormPassword from './FormPassword';
import ONYXKEYS from '../../ONYXKEYS';
import renderPrimerRoot from '../../lib/renderPrimerRoot';
import registerDashboardRefresh from './refreshDashboard';
import DashboardErrorBoundary from '../../component/DashboardErrorBoundary';

/**
 * Display our dashboard with the list of issues
 */
function showDashboard() {
    // Clean up password form
    $('.repository-content').children('.passwordform').remove();

    if (!$('.repository-content').children('.k2dashboard').length) {
        $('.repository-content').append('<div class="k2dashboard">');
    }

    renderPrimerRoot(
        $('.k2dashboard').show()[0],
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
    // Clean up dashboard
    $('.repository-content').children('.k2dashboard').remove();

    if (!$('.repository-content').children('.passwordform').length) {
        $('.repository-content').append('<div class="passwordform k2-passwordform">');
    }

    $('.repository-content').children('.passwordform').addClass('k2-passwordform');

    renderPrimerRoot($('.passwordform').show()[0], <FormPassword onFinished={showDashboard} />);
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
        const passwordFormWasDrawn = $('.repository-content').children('.passwordform').length;
        const dashboardWasDrawn = $('.repository-content').children('.k2dashboard').length;

        if (passwordFormWasDrawn || dashboardWasDrawn) {
            return;
        }
        $('.repository-content').children().remove();
        ReactNativeOnyx.init({
            keys: ONYXKEYS,
        });
        registerDashboardRefresh();

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
