import React from 'react';
import {createRoot} from 'react-dom/client';
import Picker from './K2PickerareaPicker';

export default function () {
    return {
        draw() {
            const root = createRoot(document.getElementsByClassName('k2pickerarea-wrapper')[0]);
            root.render(<Picker />);
        },
    };
}
