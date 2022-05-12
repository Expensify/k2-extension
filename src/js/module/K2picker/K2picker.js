import React from 'react';
import ReactDOM from 'react-dom';
import Picker from './Picker';

/**
 * Displays the picker for the KSV2 Labels
 *
 * @return {Object}
 */
export default function () {
    return {
        draw() {
            ReactDOM.render(
                <Picker />,
                document.getElementsByClassName('k2picker-wrapper')[0],
            );
        },
    };
}
