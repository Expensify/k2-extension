import React from 'react';
import ReactDOM from 'react-dom';
import Toggle from './toggle';

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