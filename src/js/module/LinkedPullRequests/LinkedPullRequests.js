import React from 'react';
import {createRoot} from 'react-dom/client';
import PullRequestList from './PullRequestList';

export default function () {
    return {
        /**
         * GitHub renders the Development section in the browser and can render it again later,
         * so this is called often and only draws when our list is missing.
         */
        draw() {
            const section = document.querySelector('div[data-testid="sidebar-development-section"]');
            if (!section) {
                return;
            }

            const issuePath = window.location.pathname;
            const existingWrapper = section.querySelector('.k2linkedprs-wrapper');
            if (existingWrapper && existingWrapper.dataset.issuePath === issuePath) {
                return;
            }

            // GitHub can keep the section when you go to another issue, so this removes the list for the previous issue.
            if (existingWrapper) {
                existingWrapper.remove();
            }

            const nativeList = section.querySelector('ul[data-testid="issue-viewer-linked-pr-container"]');
            const wrapper = document.createElement('div');
            wrapper.className = 'k2linkedprs-wrapper';
            wrapper.dataset.issuePath = issuePath;
            if (nativeList) {
                nativeList.after(wrapper);
            } else {
                section.append(wrapper);
            }

            createRoot(wrapper).render(<PullRequestList nativeList={nativeList} />);
        },
    };
}
