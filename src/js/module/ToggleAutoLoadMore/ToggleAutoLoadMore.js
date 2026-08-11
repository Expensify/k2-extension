import React from 'react';
import renderPrimerRoot from '../../lib/renderPrimerRoot';
import Toggle from './Toggle';

export default function () {
    return {
        draw() {
            renderPrimerRoot(document.getElementsByClassName('k2autoloadmore-wrapper')[0], <Toggle />);
        },
    };
}

// vim: set ts=4 sw=4 et:
