import React from 'react';
import {createRoot} from 'react-dom/client';
import Toggle from './Toggle';

export default function () {
    return {
        draw() {
            const root = createRoot(document.getElementsByClassName('k2autoloadmore-wrapper')[0]);
            root.render(<Toggle />);
        },
    };
}

// vim: set ts=4 sw=4 et:
