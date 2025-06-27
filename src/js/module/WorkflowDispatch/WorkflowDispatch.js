import React from 'react';
import {createRoot} from 'react-dom/client';
import WorkflowDispatchButton from './WorkflowDispatchButton';

export default function () {
    return {
        draw() {
            const wrapperElement = document.getElementsByClassName('workflowdispatch-wrapper')[0];
            if (wrapperElement) {
                const root = createRoot(wrapperElement);
                root.render(<WorkflowDispatchButton />);
            }
        },
    };
}
