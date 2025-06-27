import React from 'react';
import BtnGroup from '../../component/BtnGroup';
import * as API from '../../lib/api';

class WorkflowDispatchButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            showSuccess: false,
            showError: false,
            errorMessage: '',
        };
    }

    dispatchTestCoverageWorkflow = () => {
        if (this.state.isLoading) {
            return;
        }

        this.setState({isLoading: true});

        // Get the current URL to pass as the github_url parameter
        const currentUrl = window.location.href;

        // Extract PR number from URL if it's a PR
        const prMatch = currentUrl.match(/\/pull\/(\d+)/);
        const issueMatch = currentUrl.match(/\/issues\/(\d+)/);

        if (!prMatch && !issueMatch) {
            this.showErrorMessage('This button only works on GitHub PR or issue pages');
            this.setState({isLoading: false});
            return;
        }

        // Parameters for the workflow dispatch
        const owner = 'Expensify';
        const repo = 'App';
        const workflowId = 'check-test-coverage.yml';
        const ref = 'hackathon-testrailsTryhardsAction';
        const inputs = {
            github_url: currentUrl,
        };

        API.dispatchWorkflow(owner, repo, workflowId, ref, inputs)
            .then(() => {
                this.setState({isLoading: false});
                this.showSuccessMessage();
            })
            .catch((error) => {
                console.error('Error dispatching workflow:', error);
                this.setState({isLoading: false});
                this.showErrorMessage(`Error dispatching workflow: ${error.message || 'Unknown error'}`);
            });
    };

    showSuccessMessage() {
        this.setState({showSuccess: true}, () => {
            setTimeout(() => {
                this.setState({showSuccess: false});
            }, 3000);
        });
    }

    showErrorMessage(message) {
        this.setState({
            showError: true,
            errorMessage: message,
        }, () => {
            setTimeout(() => {
                this.setState({showError: false, errorMessage: ''});
            }, 5000);
        });
    }

    render() {
        return (
            <div>
                <BtnGroup isVertical>
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={this.dispatchTestCoverageWorkflow}
                        disabled={this.state.isLoading}
                    >
                        <span role="img" aria-label="workflow dispatch">
                            {this.state.isLoading ? (
                                <>
                                    <div className="loader" style={{display: 'inline-block', marginRight: '5px'}} />
                                    Running...
                                </>
                            ) : (
                                <>🚀 Run Test Coverage</>
                            )}
                        </span>
                    </button>

                    {this.state.showSuccess && (
                        <div style={{
                            color: 'green',
                            fontSize: '12px',
                            marginTop: '5px',
                            opacity: this.state.showSuccess ? 1 : 0,
                            transition: 'opacity 0.3s ease-in-out',
                        }}
                        >
                            ✅ Workflow dispatched successfully!
                        </div>
                    )}

                    {this.state.showError && (
                        <div style={{
                            color: 'red',
                            fontSize: '12px',
                            marginTop: '5px',
                            opacity: this.state.showError ? 1 : 0,
                            transition: 'opacity 0.3s ease-in-out',
                        }}
                        >
                            {this.state.errorMessage}
                        </div>
                    )}
                </BtnGroup>
            </div>
        );
    }
}

export default WorkflowDispatchButton;
