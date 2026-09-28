/* eslint-disable react/no-danger */

import React from 'react';
import PropTypes from 'prop-types';
import loginIllustration from '../../../../assets/simple-illustration__submit-daily.svg';
import * as GitHubOAuth from '../../lib/GitHubOAuth';

const propTypes = {
    /** A callback function that is triggered after sign in succeeds */
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

        this.handleOAuth = this.handleOAuth.bind(this);
    }

    /**
     * Handle OAuth authentication
     */
    async handleOAuth() {
        if (!GitHubOAuth.isOAuthAvailable()) {
            this.setState({
                error: 'Sign in is not available in this browser context.',
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
                error: `Sign in failed: ${error.message}`,
                isLoading: false,
            });
        }
    }

    render() {
        const isOAuthAvailable = GitHubOAuth.isOAuthAvailable();

        return (
            <div className="k2-login-shell">
                <section className="k2-login-hero">
                    <div className="k2-login-card">
                        <div className="k2-login-card-header">
                            <span
                                aria-hidden="true"
                                className="k2-login-illustration"
                                dangerouslySetInnerHTML={{__html: loginIllustration}}
                            />
                            <div>
                                <span className="k2-login-card-label">K2 Login</span>
                                <h2>Welcome to K2</h2>
                            </div>
                        </div>

                        {this.state.error && (
                            <div className="flash flash-error k2-login-error">
                                {this.state.error}
                            </div>
                        )}

                        <p className="k2-login-card-copy">
                            Sign in with GitHub to view your K2 dashboard and assigned work.
                        </p>

                        {!isOAuthAvailable && (
                            <p className="k2-login-unavailable">
                                Sign in is not available in this browser context.
                            </p>
                        )}

                        <button
                            className="btn btn-primary k2-login-button"
                            type="button"
                            onClick={this.handleOAuth}
                            disabled={this.state.isLoading || !isOAuthAvailable}
                        >
                            {this.state.isLoading ? 'Authenticating...' : 'Continue with GitHub'}
                        </button>
                    </div>
                </section>
            </div>
        );
    }
}

FormPassword.propTypes = propTypes;
FormPassword.defaultProps = defaultProps;

export default FormPassword;
