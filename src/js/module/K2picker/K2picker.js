import React from 'react';
import renderPrimerRoot from '../../lib/renderPrimerRoot';
import K2PickerPicker from './K2PickerPicker';

/**
 * Displays the picker for the KSV2 Labels
 *
 * @return {Object}
 */
export default function () {
    return {
        draw() {
            renderPrimerRoot(document.getElementsByClassName('k2picker-wrapper')[0], <K2PickerPicker />);
        },
    };
}
