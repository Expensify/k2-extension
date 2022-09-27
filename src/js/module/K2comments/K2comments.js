import React from 'react';
import ReactDOM from 'react-dom';
import CommentsButtons from './CommentsButtons';

export default function () {
    return {
        draw() {
            ReactDOM.render(
                <CommentsButtons />,
                document.getElementsByClassName('k2comments-wrapper')[0],
            );
        },
    };
}
