import React from 'react';
import {createRoot} from 'react-dom/client';
import PreviousIssuesButtons from './PreviousIssuesButton';

export default function () {
    return {
        draw() {
            const root = createRoot(document.getElementsByClassName('k2previousissue-wrapper')[0]);
            root.render(<PreviousIssuesButtons />);
        },
    };
}
