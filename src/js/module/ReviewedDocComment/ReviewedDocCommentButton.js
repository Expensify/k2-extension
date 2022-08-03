import React from 'react';
import BtnGroup from '../../component/BtnGroup';
import {addComment} from '../../lib/actions/Issues';

class ReviewedDocCommentButton extends React.Component {
    constructor(props) {
        super(props);

        this.addReviewedDocComment = this.addReviewedDocComment.bind(this);
    }

    addReviewedDocComment() {
        addComment('I have read and reviewed this Design Doc!')
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
            </div>
        );
    }
}

export default ReviewedDocCommentButton;
