import $ from 'jquery';
import React from 'react';
import _ from 'underscore';
import * as prefs from '../../lib/prefs';
import PanelList from '../../component/panel/PanelList';

/**
 * FORM - Password
 *
 * Displays a form to get the user's password
 *
 * @param {Function} onFinished called when the form is done
 */
export default React.createClass({

    /**
     * The items which will be displayed in our form
     *
     * @type {Array}
     */
    items: [
        {
            id: 'password',
            type: 'password',
            label: 'Personal Access Token',
            className: 'input-block',
            hint: 'A personal access token is required to make custom queries agains the GitHub.com API.',
            required: true,
            focus: true,
        },
    ],

    /**
     * Get the password and store it as a user preference
     *
     * @date 2015-06-15
     *
     * @param {Object} e React form submit event
     */
    submitForm(e) {
        const formData = $(this.form).serializeArray();
        const passwordData = _.findWhere(formData, {name: 'password'});

        // Set ghToken too if we are logging in for the first time so we can
        // more easily transition later
        prefs.set('ghToken', passwordData.value, () => {
            if (!this.props.onFinished) {
                return;
            }
            this.props.onFinished();
        });

        e.preventDefault();
    },

    render() {
        return (
            <div className="columns">
                <div className="one-third column centered">
                    <form ref={el => this.form = el} onSubmit={this.submitForm}>
                        <PanelList title="Enter Credentials" list={this.items} item="form">
                            <footer className="panel-footer form-actions">
                                <button className="btn btn-primary" type="submit">
                                    Submit
                                </button>
                            </footer>
                        </PanelList>
                    </form>
                </div>
            </div>
        );
    },
});
