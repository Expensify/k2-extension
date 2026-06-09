import React from 'react';
import PropTypes from 'prop-types';
import * as GitHubOAuth from '../../lib/GitHubOAuth';
import Title from '../../component/panel-title/Title';

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

    render() {
        const isOAuthAvailable = GitHubOAuth.isOAuthAvailable();

        return (
            <div className="columns">
                <div className="one-third column centered">
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
                                    Sign in with your GitHub account to use K2.
                                </p>
                                {!isOAuthAvailable && (
                                    <p className="text-small text-gray">
                                        OAuth is not available in this browser context.
                                    </p>
                                )}
                            </div>

                            <footer className="panel-footer form-actions">
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={this.handleOAuth}
                                    disabled={this.state.isLoading || !isOAuthAvailable}
                                >
                                    {this.state.isLoading ? 'Authenticating…' : 'Sign in with GitHub'}
                                </button>
                            </footer>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

FormPassword.propTypes = propTypes;
FormPassword.defaultProps = defaultProps;

export default FormPassword;
