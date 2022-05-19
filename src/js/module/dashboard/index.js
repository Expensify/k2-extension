import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactNativeOnyx from 'react-native-onyx/web';
import ListIssues from './ListIssues';
import FormPassword from './FormPassword';
import * as prefs from '../../lib/prefs';
import * as Preferences from '../../lib/actions/Preferences';

/**
 * Display our dashboard with the list of issues
 */
function showDashboard() {
    $('.repository-content').children().hide();
    if (!$('.repository-content').children('.k2dashboard').length) {
        $('.repository-content').append('<div class="k2dashboard">');
    }
    ReactDOM.render(
        <ListIssues pollInterval={60000} />,
        $('.k2dashboard').show()[0],
    );
}

/**
 * Prompt them for their password, then show the dashboard
 *
 * @date 2015-06-14
 */
function showPasswordForm() {
    $('.repository-content').children().remove();
    if (!$('.repository-content').children('.passwordform').length) {
        $('.repository-content').append('<div class="passwordform">');
    }
    ReactDOM.render(
        <FormPassword onFinished={showDashboard} />,
        $('.passwordform').show()[0],
    );
}

export default () => ({
    draw() {
        $('.repository-content').children().remove();
        ReactNativeOnyx.init();

        const preferencesOnyxConnection = ReactNativeOnyx.connect({
            key: 'preferences',
            callback: (preferences) => {
                ReactNativeOnyx.disconnect(preferencesOnyxConnection);

                // If there is no `preferences` object, then we need to try and migrate their ghToken from the old
                // storage to the new storage
                if (!preferences) {
                    prefs.get('ghToken', (ghToken) => {
                        if (ghToken) {
                            // Save the github token to our locally stored preferences
                            Preferences.setGitHubToken(ghToken);
                            showDashboard();
                        } else {
                            // Have them enter a ghToken
                            showPasswordForm();
                        }
                    });
                    return;
                }

                // If there is a `preferences` object, but it doesn't have a ghToken, have the user enter one
                if (!preferences.ghToken) {
                    showPasswordForm();
                    return;
                }

                showDashboard();
            },
        });
    },
});
