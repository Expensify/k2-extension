import React from 'react';
import {createRoot} from 'react-dom/client';
import PullRequestList from './PullRequestList';

export default function () {
    return {
        draw() {
            const root = createRoot(document.getElementsByClassName('k2linkedprs-wrapper')[0]);
            root.render(<PullRequestList />);
        },
    };
}
