import React from 'react';
import {createRoot} from 'react-dom/client';
import WorkflowDispatchMenu from '../../component/list-item/WorkflowDispatchMenu';

export default function () {
    return {
        draw(prUrl) {
            const wrapper = document.getElementsByClassName(
                'k2workflowmenu-wrapper',
            )[0];
            if (!wrapper) {
                return;
            }
            const root = createRoot(wrapper);
            root.render(
                <WorkflowDispatchMenu prUrl={prUrl} variant="sidebar" />,
            );
        },
    };
}
