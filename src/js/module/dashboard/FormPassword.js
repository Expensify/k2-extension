import $ from 'jquery';
import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import * as Preferences from '../../lib/actions/Preferences';
import Title from '../../component/panel-title/Title';

const propTypes = {
    /** A callback function that is triggered after the form is submitted */
    onFinished: PropTypes.func,
};
const defaultProps = {
    onFinished: () => {},
};

class FormPassword extends React.Component {
    constructor(props) {
        super(props);

        this.submitForm = this.submitForm.bind(this);
    }

    componentDidMount() {
        this.input.focus();
    }

    /**
     * Get the password and store it as a user preference
     *
     * @param {Object} e React form submit event
     */
    submitForm(e) {
        e.preventDefault();
        const formData = $(this.form).serializeArray();
        const passwordData = _.findWhere(formData, {name: 'password'});

        // Save the github token to our locally stored preferences
        Preferences.setGitHubToken(passwordData.value);

        // Trigger the callback function so we can move on
        this.props.onFinished();
    }

    render() {
        return (
            <div className="columns">
                <div className="one-third column centered">
                    <form ref={el => this.form = el} onSubmit={this.submitForm}>
                        <div className="panel mb-3">
                            <Title text="Enter Credentials" />
                            <div>
                                <div className="panel-item">
                                    <label htmlFor="password">Personal Access Token</label>

                                    <input
                                        ref={el => this.input = el}
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="input-block"
                                        required
                                    />

                                    <p>
                                        A
                                        {' '}
                                        <a href="https://github.com/Expensify/k2-extension/#note-it-requires-a-personal-access-token" target="_blank" rel="noopener noreferrer">
                                            Personal Access Token
                                        </a>
                                        {' '}
                                        is required to make custom queries against the GitHub.com API.
                                    </p>
                                </div>

                                <footer className="panel-footer form-actions">
                                    <button className="btn btn-primary" type="submit">
                                        Submit
                                    </button>
                                </footer>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

FormPassword.propTypes = propTypes;
FormPassword.defaultProps = defaultProps;

export default FormPassword;
