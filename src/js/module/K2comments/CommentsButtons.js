import React from 'react';
import _ from 'underscore';
import BtnGroup from '../../component/BtnGroup';
import * as Issues from '../../lib/actions/Issues';

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

    addParticipationComment(comment) {
        Issues.addComment(comment);

        // Show the confirmation message for 5 seconds
        this.setState({shouldShowConfirmationMessage: true}, () => {
            setTimeout(() => {
                this.setState({shouldShowConfirmationMessage: false, isButtonSelected: false});
            }, 5000);
        });
    }

    render() {
        return (
            <div>
                <BtnGroup isVertical>
                    <button
                        type="button"
                        className={this.state.isOpen ? 'btn btn-sm selected' : 'btn btn-sm'}
                        onClick={() => this.setState(prevState => ({isOpen: !prevState.isOpen}))}
                    >
                        <span role="img" aria-label="reviewed doc emojis">
                            {`Comments Shortcuts ${this.state.isOpen ? '⬆️' : '⬇️'}`}
                        </span>
                    </button>
                    {this.state.isOpen && (
                        <>
                            {this.state.isButtonSelected ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() => this.setState({participationComment: '', isButtonSelected: false, selectedButton: {}})}
                                    >
                                        <span role="img" aria-label={this.state.selectedButton.ariaLabel}>
                                            {this.state.selectedButton.title}
                                        </span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    {_.map(participationButtons, participationButton => (
                                        <button
                                            type="button"
                                            className="btn btn-sm"
                                            onClick={() => this.setState({participationComment: participationButton.comment, isButtonSelected: true, selectedButton: participationButton})}
                                        >
                                            <span role="img" aria-label={participationButton.ariaLabel}>
                                                {participationButton.title}
                                            </span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </BtnGroup>
                {(this.state.isOpen && this.state.isButtonSelected && !this.state.shouldShowConfirmationMessage) && (
                    <button
                        type="button"
                        className="btn btn-sm btn-primary mt-4"
                        onClick={() => this.addParticipationComment(this.state.participationComment)}
                    >
                        <span role="img" aria-label="Send Message">
                            Send Message
                        </span>
                    </button>
                )}
                {this.state.shouldShowConfirmationMessage && (
                    <div className="mt-4 text-center">
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
