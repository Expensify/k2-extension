import React from 'react';
import renderPrimerRoot from '../../lib/renderPrimerRoot';
import PreviousIssuesButtons from './PreviousIssuesButtons';

export default function () {
    return {
        draw() {
            renderPrimerRoot(document.getElementsByClassName('k2previousissues-wrapper')[0], <PreviousIssuesButtons />);
        },
    };
}
