import React from 'react';
import ReactDOM from 'react-dom';
import Toggle from './Toggle';

export default function () {
    return {
        draw() {
            ReactDOM.render(
                <Toggle />,
                document.getElementsByClassName('k2togglereviewing-wrapper')[0],
            );
        },
    };
}
