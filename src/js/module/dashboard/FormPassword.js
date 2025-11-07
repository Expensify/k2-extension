import $ from 'jquery';
import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import * as Preferences from '../../lib/actions/Preferences';
import * as GitHubOAuth from '../../lib/GitHubOAuth';
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

        this.state = {
            isLoading: false,
            error: null,
        };

        this.submitForm = this.submitForm.bind(this);
        this.handleOAuth = this.handleOAuth.bind(this);
    }

    componentDidMount() {
        if (!this.input) {
            return;
        }
        this.input.focus();
    }

    /**
     * Handle OAuth authentication
     */
    async handleOAuth() {
        if (!GitHubOAuth.isOAuthAvailable()) {
            this.setState({
                error: 'OAuth is not available in this browser context.',
            });
            return;
        }

        this.setState({
            isLoading: true,
            error: null,
        });

        try {
            await GitHubOAuth.initiateOAuth();

            // OAuth success - token is stored automatically
            // Clear loading state before calling onFinished
            this.setState({
                isLoading: false,
                error: null,
            });

            // Trigger the callback function so we can move on
            this.props.onFinished();
        } catch (error) {
            this.setState({
                error: `OAuth authentication failed: ${error.message}`,
                isLoading: false,
            });
        }
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

        if (!passwordData || !passwordData.value.trim()) {
            this.setState({
                error: 'Please enter a valid Personal Access Token.',
            });
            return;
        }

        // Save the github token to our locally stored preferences
        Preferences.setGitHubToken(passwordData.value.trim());

        // Trigger the callback function so we can move on
        this.props.onFinished();
    }

    render() {
        const isOAuthAvailable = GitHubOAuth.isOAuthAvailable();

        return (
            <div className="columns">
                <div className="one-third column centered">
                    <form ref={el => this.form = el} onSubmit={this.submitForm}>
                        <div className="panel mb-3">
                            <Title text="GitHub Authentication" />
                            <div>
                                {this.state.error && (
                                    <div className="panel-item">
                                        <div className="flash flash-error">
                                            {this.state.error}
                                        </div>
                                    </div>
                                )}

                                <div className="panel-item">
                                    <p>
                                        Or sign in with GitHub using OAuth (recommended).
                                    </p>
                                    {!isOAuthAvailable && (
                                        <p className="text-small text-gray">
                                            OAuth is not available in this browser context. Please use Personal Access Token.
                                        </p>
                                    )}
                                </div>

                                <div className="panel-item">
                                    <label htmlFor="password">Personal Access Token</label>

                                    <input
                                        ref={el => this.input = el}
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="input-block"
                                        required
                                        disabled={this.state.isLoading}
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
                                    <button
                                        className="btn btn-primary"
                                        type="submit"
                                        disabled={this.state.isLoading}
                                    >
                                        Save Token
                                    </button>
                                    <button
                                        className="btn btn-primary ml-2"
                                        type="button"
                                        onClick={this.handleOAuth}
                                        disabled={this.state.isLoading || !isOAuthAvailable}
                                    >
                                        {this.state.isLoading ? 'Authenticating…' : 'Sign in with GitHub'}
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
