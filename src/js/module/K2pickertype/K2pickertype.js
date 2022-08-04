import React from 'react';
import ReactDOM from 'react-dom';
import K2PickertypePicker from './K2PickertypePicker';

export default function () {
    return {
        draw() {
            ReactDOM.render(
                <K2PickertypePicker />,
                document.getElementsByClassName('k2pickertype-wrapper')[0],
            );
        },
    };
}
