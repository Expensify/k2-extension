import React from 'react';
import BtnGroup from '../../component/BtnGroup';
import {addComment} from '../../lib/actions/Issues';

class ReviewedDocCommentButton extends React.Component {
    constructor(props) {
        super(props);

        this.addReviewedDocComment = this.addReviewedDocComment.bind(this);

        this.state = {
            shouldShowConfirmationMessage: false,
        }
    }

    addReviewedDocComment() {
        addComment('I have read and reviewed this Design Doc!');

        // Show the confirmation message for 5 seconds
        this.setState({shouldShowConfirmationMessage: true}, () => {
            setTimeout(() => {
                this.setState({shouldShowConfirmationMessage: false});
            }, 5000);
        })
    }

    render() {
        return (
            <div>
                <h6>Design Docs</h6>
                <BtnGroup>
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={this.addReviewedDocComment}
                    >
                        Add &quot;Reviewed Doc&quot; Comment
                    </button>
                </BtnGroup>

                {this.state.shouldShowConfirmationMessage && (
                    <div>Added! Please wait a moment for it to appear</div>
                )}
            </div>
        );
    }
}

export default ReviewedDocCommentButton;
