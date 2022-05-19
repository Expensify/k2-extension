import React from 'react';
import ReactDOM from 'react-dom';
import ReactNativeOnyx from 'react-native-onyx';
import Toggle from './Toggle';

export default function () {
    return {
        draw() {
            ReactNativeOnyx.init();
            ReactDOM.render(
                <Toggle />,
                document.getElementsByClassName('k2togglereviewing-wrapper')[0],
            );
        },
    };
}
