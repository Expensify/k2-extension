import React from 'react';
import BtnGroup from '../../component/BtnGroup';
import * as Issues from '../../lib/actions/Issues';

class CommentsButtons extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            shouldShowConfirmationMessage: false,
        };
    }

    addParticipationComment(comment) {
        Issues.addComment(comment);

        // Show the confirmation message for 5 seconds
        this.setState({shouldShowConfirmationMessage: true}, () => {
            setTimeout(() => {
                this.setState({shouldShowConfirmationMessage: false});
            }, 5000);
        });
    }

    render() {
        return (
            <div>
                <h6>Comments shortcuts</h6>
                <BtnGroup>
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => this.addParticipationComment('I have read and reviewed this Design Doc!')}
                    >
                        <span role="img" aria-label="reviewed doc emojis">
                            📃 ✅ Reviewed Doc
                        </span>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => this.addParticipationComment('I attended this interview!')}
                    >
                        <span role="img" aria-label="attended interview emojis">
                            ✋ Attended Interview
                        </span>
                    </button>
                </BtnGroup>

                <BtnGroup>
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => this.addParticipationComment('I have read and reviewed this Project Manager Application!')}
                    >
                        <span role="img" aria-label="reviewed project manager emojis">
                            🖊️ Reviewed Project Manager Application
                        </span>
                    </button>
                </BtnGroup>

                {this.state.shouldShowConfirmationMessage && (
                    <div>Comment added! Please wait a moment for it to appear</div>
                )}
            </div>
        );
    }
}

export default CommentsButtons;
