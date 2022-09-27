import React from 'react';
import ReactDOM from 'react-dom';
import ReviewedDocCommentButton from './ReviewedDocCommentButton';

export default function () {
    return {
        draw() {
            ReactDOM.render(
                <ReviewedDocCommentButton />,
                document.getElementsByClassName('k2comments-wrapper')[0],
            );
        },
    };
}
