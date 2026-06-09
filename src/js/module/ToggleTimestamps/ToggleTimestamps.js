import React from 'react';
import {createRoot} from 'react-dom/client';
import Toggle from './Toggle';

export default function () {
    return {
        draw() {
            const root = createRoot(document.getElementsByClassName('k2toggletimestamps-wrapper')[0]);
            root.render(<Toggle />);
        },
    };
}
