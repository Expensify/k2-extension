import React from 'react';
import ReactDOM from 'react-dom';
import ReactNativeOnyx from 'react-native-onyx';
import Picker from './K2PickerareaPicker';
import ONYXKEYS from '../../ONYXKEYS';

export default function () {
    return {
        draw() {
            ReactNativeOnyx.init({
                keys: ONYXKEYS,
            });
            ReactDOM.render(
                <Picker />,
                document.getElementsByClassName('k2pickerarea-wrapper')[0],
            );
        },
    };
}
