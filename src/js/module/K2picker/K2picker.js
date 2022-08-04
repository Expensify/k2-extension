import React from 'react';
import ReactDOM from 'react-dom';
import K2PickerPicker from './K2PickerPicker';

/**
 * Displays the picker for the KSV2 Labels
 *
 * @return {Object}
 */
export default function () {
    return {
        draw() {
            ReactDOM.render(
                <K2PickerPicker />,
                document.getElementsByClassName('k2picker-wrapper')[0],
            );
        },
    };
}
