import React from 'react';
import ReactDOM from 'react-dom';
import ReactNativeOnyx from 'react-native-onyx/web';
import K2PickertypePicker from './K2PickertypePicker';

export default function () {
    return {
        draw() {
            ReactNativeOnyx.init();
            ReactDOM.render(
                <K2PickertypePicker />,
                document.getElementsByClassName('k2pickertype-wrapper')[0],
            );
        },
    };
}
