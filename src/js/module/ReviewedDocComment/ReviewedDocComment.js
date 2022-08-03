import React from 'react';
import ReactDOM from 'react-dom';
import ReactNativeOnyx from 'react-native-onyx';
import K2PickertypePicker from './K2PickertypePicker';
import ONYXKEYS from '../../ONYXKEYS';

export default function () {
    return {
        draw() {
            ReactNativeOnyx.init({
                keys: ONYXKEYS,
            });
            ReactDOM.render(
                <K2PickertypePicker />,
                document.getElementsByClassName('k2pickertype-wrapper')[0],
            );
        },
    };
}
