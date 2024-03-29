import $ from 'jquery';
import React from 'react';
import {createRoot} from 'react-dom/client';
import ReactNativeOnyx from 'react-native-onyx';
import ListIssues from './ListIssues';
import FormPassword from './FormPassword';
import ONYXKEYS from '../../ONYXKEYS';

/**
 * Display our dashboard with the list of issues
 */
function showDashboard() {
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
    if (!$('.repository-content').children('.passwordform').length) {
        $('.repository-content').append('<div class="passwordform">');
    }

    const root = createRoot($('.passwordform').show()[0]);
    root.render(<FormPassword onFinished={showDashboard} />);
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

        const preferencesOnyxConnection = ReactNativeOnyx.connect({
            key: 'preferences',
            callback: (preferences) => {
                ReactNativeOnyx.disconnect(preferencesOnyxConnection);

                // If there is a `preferences` object, but it doesn't have a ghToken, have the user enter one
                if (!preferences || !preferences.ghToken) {
                    showPasswordForm();
                    return;
                }

                showDashboard();
            },
        });
    },
});
