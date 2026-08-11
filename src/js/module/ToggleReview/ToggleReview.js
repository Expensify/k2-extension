import React from 'react';
import renderPrimerRoot from '../../lib/renderPrimerRoot';
import Toggle from './Toggle';

export default function () {
    return {
        draw() {
            renderPrimerRoot(document.getElementsByClassName('k2togglereviewing-wrapper')[0], <Toggle />);
        },
    };
}
