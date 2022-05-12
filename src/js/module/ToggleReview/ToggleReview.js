import React from 'react';
import ReactDOM from 'react-dom';
import ToggleX from './ToggleX';

export default function () {
    return {
        draw() {
            ReactDOM.render(
                <ToggleX />,
                document.getElementsByClassName('k2togglereviewing-wrapper')[0],
            );
        },
    };
}
