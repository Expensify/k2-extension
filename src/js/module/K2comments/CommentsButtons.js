import React from 'react';
import _ from 'underscore';
import BtnGroup from '../../component/BtnGroup';
import * as Issues from '../../lib/actions/Issues';
import * as API from '../../lib/api';

/**
 * Get the KSv2 frequency label from the current issue
 */
async function getKSv2FrequencyLabel() {
    try {
        const issueData = await API.getCurrentIssueDescription();
        const labels = issueData.data.labels || [];

        const ksv2Labels = ['Hourly', 'Daily', 'Weekly', 'Monthly'];
        const foundKsv2Label = _.find(ksv2Labels, labelName => _.findWhere(labels, {name: labelName}));

        return foundKsv2Label || 'Latest';
    } catch (error) {
        return 'Latest';
    }
}

/**
 * Generate the engineering update template with dynamic KSv2 label
 */
async function generateEngineeringUpdateTemplate() {
    const ksv2Label = await getKSv2FrequencyLabel();
    const currentUser = API.getCurrentUser();

    return `# ${ksv2Label} Update
- Here is the progress update

### Next Steps
- @${currentUser} Identify the immediate next steps that need to be taken

#### ETA
- Post a specific ETA for when I think the issue will be finished`;
}

const participationButtons = [
    {
        title: '📃 ✅ Reviewed Doc',
        ariaLabel: 'reviewed doc emojis',
        comment: 'I have read and reviewed this Design Doc!',
    },
    {
        title: '✋ Attended Interview',
        ariaLabel: 'attended interview emojis',
        comment: 'I attended this interview!',
    },
    {
        title: '🖊️ Reviewed Project Manager Application',
        ariaLabel: 'reviewed project manager emojis',
        comment: 'I have read and reviewed this Project Manager Application!',
    },
    {
        title: '📱 Reviewed Product Manager Application',
        ariaLabel: 'reviewed product manager emojis',
        comment: 'I have read and reviewed this Product Manager Application!',
    },
    {
        title: '📝 Engineering Update',
        ariaLabel: 'engineering update template',
        comment: generateEngineeringUpdateTemplate,
    },
];

class CommentsButtons extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
            isButtonSelected: false,
            shouldShowConfirmationMessage: false,
            participationComment: '',
            selectedButton: {},
        };
    }

    async addParticipationComment(comment) {
        try {
            // If comment is a function, call it to get the actual comment text
            const commentText = typeof comment === 'function' ? await comment() : comment;
            Issues.addComment(commentText);

            // Show the confirmation message for 5 seconds
            this.setState({shouldShowConfirmationMessage: true}, () => {
                setTimeout(() => {
                    this.setState({shouldShowConfirmationMessage: false, isButtonSelected: false});
                }, 5000);
            });
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    }

    render() {
        return (
            <div>
                <BtnGroup isVertical>
                    <button
                        type="button"
                        className={(this.state.isOpen || this.state.isButtonSelected) ? 'btn btn-sm selected' : 'btn btn-sm'}
                        onClick={() => this.setState(prevState => ({isOpen: !prevState.isOpen, isButtonSelected: false}))}
                    >
                        <span role="img" aria-label="reviewed doc emojis">
                            {`${this.state.isButtonSelected ? this.state.selectedButton.title : 'Comments Shortcuts'}  ${this.state.isOpen ? '⬆️' : '⬇️'}`}
                        </span>
                    </button>
                    {this.state.isOpen && (
                        this.state.isButtonSelected ? (
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => this.setState({participationComment: '', isButtonSelected: false, selectedButton: {}})}
                            >
                                <span role="img" aria-label={this.state.selectedButton.ariaLabel}>
                                    {this.state.selectedButton.title}
                                </span>
                            </button>
                        ) : (
                            _.map(participationButtons, (participationButton, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => this.setState({
                                        participationComment: participationButton.comment, isButtonSelected: true, selectedButton: participationButton, isOpen: false,
                                    })}
                                >
                                    <span role="img" aria-label={participationButton.ariaLabel}>
                                        {participationButton.title}
                                    </span>
                                </button>
                            ))
                        )
                    )}
                </BtnGroup>
                {(this.state.isButtonSelected && !this.state.shouldShowConfirmationMessage) && (
                    <button
                        type="button"
                        className="btn btn-sm btn-primary mt-3"
                        onClick={() => this.addParticipationComment(this.state.participationComment)}
                    >
                        <span role="img" aria-label="Send Message">
                            Send Message
                        </span>
                    </button>
                )}
                {this.state.shouldShowConfirmationMessage && (
                    <div className="mt-3 text-center">
                        Comment added!
                        <br />
                        Please wait a moment for it to appear
                    </div>
                )}
            </div>
        );
    }
}

export default CommentsButtons;
