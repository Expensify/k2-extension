import React, {useEffect, useRef, useState} from 'react';
import _ from 'underscore';
import moment from 'moment';
import pullRequestPropTypes from '../../lib/pullRequestPropTypes';
import * as API from '../../lib/api';

const propTypes = {
    /** The stalled pull request this button nudges */
    pr: pullRequestPropTypes.isRequired,
};

function StallNudgeButton({pr}) {
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState(null);
    const resultTimeoutRef = useRef(null);

    useEffect(() => () => clearTimeout(resultTimeoutRef.current), []);

    const daysStalled = moment().diff(pr.updatedAt, 'days');

    const nudge = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsSending(true);
        setResult(null);
        try {
            const reviewerMentions = _.chain((pr.reviewRequests && pr.reviewRequests.nodes) || [])
                .map(node => node.requestedReviewer && node.requestedReviewer.login)
                .compact()
                .map(login => `@${login}`)
                .value()
                .join(' ');
            const body = `${reviewerMentions ? `${reviewerMentions} ` : ''}Friendly bump 🙏 — this PR has been waiting on review for ${daysStalled} days.`;
            await API.addCommentToUrl(pr.url, body);
            setResult('success');
        } catch (error) {
            setResult('error');
        } finally {
            setIsSending(false);
            resultTimeoutRef.current = setTimeout(() => setResult(null), 3000);
        }
    };

    let content = 'Nudge';
    if (isSending) {
        content = <span className="k2-workflow-menu-loader" />;
    } else if (result === 'success') {
        content = '✓ Nudged';
    } else if (result === 'error') {
        content = '✗ Failed';
    }

    return (
        <span className="k2-stall">
            <span className="k2-stall-badge">{`stalled ${daysStalled}d`}</span>
            <button
                type="button"
                className={`k2-agent-dispatch-button${result ? ` k2-agent-dispatch-${result}` : ''}`}
                disabled={isSending}
                onClick={nudge}
                title="Post a bump comment mentioning the requested reviewers"
            >
                {content}
            </button>
        </span>
    );
}

StallNudgeButton.propTypes = propTypes;
StallNudgeButton.displayName = 'StallNudgeButton';

export default StallNudgeButton;
