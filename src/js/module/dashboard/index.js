import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactNativeOnyx from 'react-native-onyx';
import ListIssues from './ListIssues';
import FormPassword from './FormPassword';

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

        ReactNativeOnyx.connect({
            key: 'preferences',
            callback: (preferences) => {
                // Make sure they have entered their API token
                if (!preferences || !preferences.ghToken) {
                    showPasswordForm();
                    return;
                }

                showDashboard();
            },
        });
    },
});
