import React from 'react';
import {createRoot} from 'react-dom/client';
import CommentsButtons from './CommentsButtons';

export default function () {
    return {
        draw() {
            const root = createRoot(document.getElementsByClassName('k2comments-wrapper')[0]);
            root.render(<CommentsButtons />);
        },
    };
}
