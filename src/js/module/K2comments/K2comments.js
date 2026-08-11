import React from 'react';
import renderPrimerRoot from '../../lib/renderPrimerRoot';
import CommentsButtons from './CommentsButtons';

export default function () {
    return {
        draw() {
            renderPrimerRoot(document.getElementsByClassName('k2comments-wrapper')[0], <CommentsButtons />);
        },
    };
}
