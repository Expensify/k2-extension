import React from 'react';
import ReactDOM from 'react-dom';
import Picker from './picker';

export default function () {
    return {
        draw() {
            ReactDOM.render(
                <Picker />,
                document.getElementsByClassName('k2pickerarea-wrapper')[0],
            );
        },
    };
}