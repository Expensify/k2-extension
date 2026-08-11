import React from 'react';
import renderPrimerRoot from '../../lib/renderPrimerRoot';
import K2PickertypePicker from './K2PickertypePicker';

export default function () {
    return {
        draw() {
            renderPrimerRoot(document.getElementsByClassName('k2pickertype-wrapper')[0], <K2PickertypePicker />);
        },
    };
}
