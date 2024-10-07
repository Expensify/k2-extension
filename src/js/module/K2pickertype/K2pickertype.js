import React from 'react';
import {createRoot} from 'react-dom/client';
import K2PickertypePicker from './K2PickertypePicker';

export default function () {
    return {
        draw() {
            const root = createRoot(document.getElementsByClassName('k2pickertype-wrapper')[0]);
            root.render(<K2PickertypePicker />);
        },
    };
}
