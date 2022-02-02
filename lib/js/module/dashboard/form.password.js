
/**
 * FORM - Password
 *
 * Displays a form to get the user's password
 *
 * @param {Function} onFinished called when the form is done
 */

const $ = require('jquery');
const _ = require('underscore');
const React = require('react');
const prefs = require('../../lib/prefs');
const PanelList = require('../../component/panel/list');

module.exports = React.createClass({

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
   * @author Tim Golen <tim@golen.net>
   *
   * @date 2015-06-15
   *
   * @param {Object} e React form submit event
   */
    submitForm(e) {
        const formData = $(this.refs.form).serializeArray();
        const passwordData = _.findWhere(formData, {name: 'password'});
        const _this = this;

        // Set ghToken too if we are logging in for the first time so we can
        // more easily transition later
        prefs.set('ghToken', passwordData.value, () => {
            if (_this.props.onFinished) {
                _this.props.onFinished();
            }
        });

        e.preventDefault();
    },

    render() {
        return (
            <div className="columns">
                <div className="one-third column centered">
                    <form ref="form" onSubmit={this.submitForm}>
                        <PanelList title="Enter Credentials" list={this.items} item="form">
                            <footer className="panel-footer form-actions">
                                <button className="btn btn-primary">
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
