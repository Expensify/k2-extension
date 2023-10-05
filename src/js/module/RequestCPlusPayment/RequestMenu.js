import React from 'react';
import ReactDOM from 'react-dom';
import Request from './Request';
// eslint-disable-next-line rulesdir/prefer-import-module-contents
import {getCurrentIssueDetails} from '../../lib/actions/Issues';

export default function () {
    const issueDetails = getCurrentIssueDetails();
    return {
        draw() {
            ReactDOM.render(
                <Request issueID={issueDetails.issue_number} />,
                document.getElementsByClassName('k2request-wrapper')[0],
            );
        },
    };
}
