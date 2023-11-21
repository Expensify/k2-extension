import React from 'react';
import {createRoot} from 'react-dom/client';
import K2PickerPicker from './K2PickerPicker';

/**
 * Displays the picker for the KSV2 Labels
 *
 * @return {Object}
 */
export default function () {
    return {
        draw() {
            const root = createRoot(document.getElementsByClassName('k2picker-wrapper')[0]);
            root.render(<K2PickerPicker />);
        },
    };
}
