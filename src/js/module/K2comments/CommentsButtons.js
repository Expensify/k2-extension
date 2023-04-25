import React from 'react';
import _ from 'underscore';
import BtnGroup from '../../component/BtnGroup';
import * as Issues from '../../lib/actions/Issues';

// eslint-disable-next-line no-unused-vars
const buttonData = [
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
            shouldShowConfirmationMessage: false,
            isOpen: false,
            hasSelectedButton: false,
            participationComment: '',
            selectedButton: {},
        };
    }

    addParticipationComment(comment) {
        Issues.addComment(comment);

        // Show the confirmation message for 5 seconds
        this.setState({shouldShowConfirmationMessage: true}, () => {
            setTimeout(() => {
                this.setState({shouldShowConfirmationMessage: false, hasSelectedButton: false});
            }, 5000);
        });
    }

    render() {
        return (
            <div>
                <BtnGroup isDropdown>
                    <button
                        type="button"
                        className={this.state.isOpen ? 'btn btn-sm selected' : 'btn btn-sm'}
                        onClick={() => this.setState(prevState => ({isOpen: !prevState.isOpen}))}
                    >
                        <span role="img" aria-label="reviewed doc emojis">
                            {`Comments shortcuts ${this.state.isOpen ? '⬆️' : '⬇️'}`}
                        </span>
                    </button>
                    {(this.state.hasSelectedButton && this.state.isOpen) && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => this.setState({participationComment: '', hasSelectedButton: false, selectedButton: {}})}
                            >
                                <span role="img" aria-label={this.state.selectedButton.ariaLabel}>
                                    {this.state.selectedButton.title}
                                </span>
                            </button>
                        </>
                    )}
                    {(!this.state.hasSelectedButton && this.state.isOpen) && (
                        <>
                            {_.map(buttonData, participationButton => (
                                <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => this.setState({participationComment: participationButton.comment, hasSelectedButton: true, selectedButton: participationButton})}
                                >
                                    <span role="img" aria-label={participationButton.ariaLabel}>
                                        {participationButton.title}
                                    </span>
                                </button>
                            ))}
                        </>
                    )}
                </BtnGroup>
                {(this.state.hasSelectedButton && !this.state.shouldShowConfirmationMessage && this.state.isOpen) && (
                    <button
                        type="button"
                        className="btn btn-sm send"
                        onClick={() => this.addParticipationComment(this.state.participationComment)}
                    >
                        <span role="img" aria-label="Send Message">
                            Send Message
                        </span>
                    </button>
                )}

                {this.state.shouldShowConfirmationMessage && (
                    <div className="send center-text">
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
