import React from 'react';
import {createRoot} from 'react-dom/client';
import PrimerRoot from '../component/PrimerRoot';

const roots = new WeakMap();

export default function renderPrimerRoot(container, element) {
    if (!container) {
        return null;
    }

    let root = roots.get(container);
    if (!root) {
        root = createRoot(container);
        roots.set(container, root);
    }

    root.render(<PrimerRoot>{element}</PrimerRoot>);
    return root;
}
