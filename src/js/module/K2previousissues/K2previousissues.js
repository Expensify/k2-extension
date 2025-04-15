import React from 'react';
import {createRoot} from 'react-dom/client';
import PreviousIssuesButtons from './PreviousIssuesButtons';

export default function () {
    return {
        draw() {
            const root = createRoot(document.getElementsByClassName('k2previousissues-wrapper')[0]);
            root.render(<PreviousIssuesButtons />);
        },
    };
}
