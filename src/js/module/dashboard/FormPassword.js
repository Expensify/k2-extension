import React from 'react';
import PropTypes from 'prop-types';
import {
    Banner, Button, Heading, Spinner, Stack, Text,
} from '@primer/react';
import {MarkGithubIcon} from '@primer/octicons-react';
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
            <section className="k2-login-shell" aria-labelledby="k2-login-heading">
                <Stack className="k2-login-card" align="center" gap="normal" padding="normal">
                    <MarkGithubIcon size={48} />
                    <Stack align="center" gap="condensed">
                        <Heading id="k2-login-heading" as="h1">Welcome to K2</Heading>
                        <Text className="k2-login-copy">
                            Sign in with GitHub to view your dashboard and assigned work.
                        </Text>
                    </Stack>

                    {this.state.error && (
                        <Banner
                            title="Sign in failed"
                            description={this.state.error}
                            variant="critical"
                            className="k2-login-message"
                        />
                    )}

                    {!isOAuthAvailable && (
                        <Banner
                            title="Sign in unavailable"
                            description="GitHub sign in is not available in this browser context."
                            variant="warning"
                            className="k2-login-message"
                        />
                    )}

                    <Button
                        variant="primary"
                        size="large"
                        leadingVisual={this.state.isLoading ? undefined : MarkGithubIcon}
                        onClick={this.handleOAuth}
                        disabled={this.state.isLoading || !isOAuthAvailable}
                        className="k2-login-button"
                    >
                        {this.state.isLoading ? (
                            <Stack direction="horizontal" align="center" gap="condensed">
                                <Spinner size="small" />
                                Authenticating
                            </Stack>
                        ) : 'Continue with GitHub'}
                    </Button>
                </Stack>
            </section>
        );
    }
}

FormPassword.propTypes = propTypes;
FormPassword.defaultProps = defaultProps;

export default FormPassword;
