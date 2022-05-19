import React from 'react';
import ReactDOM from 'react-dom';
import ReactNativeOnyx from 'react-native-onyx';
import Picker from './K2PickerareaPicker';

export default function () {
    return {
        draw() {
            ReactNativeOnyx.init();
            ReactDOM.render(
                <Picker />,
                document.getElementsByClassName('k2pickerarea-wrapper')[0],
            );
        },
    };
}
