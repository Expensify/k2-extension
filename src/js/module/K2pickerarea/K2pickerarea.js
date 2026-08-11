import React from 'react';
import renderPrimerRoot from '../../lib/renderPrimerRoot';
import Picker from './K2PickerareaPicker';

export default function () {
    return {
        draw() {
            renderPrimerRoot(document.getElementsByClassName('k2pickerarea-wrapper')[0], <Picker />);
        },
    };
}
