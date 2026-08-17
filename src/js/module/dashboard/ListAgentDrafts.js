import React, {useEffect, useRef, useState} from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import CONST from '../../CONST';
import Title from '../../component/panel-title/Title';
import * as API from '../../lib/api';

const POLL_INTERVAL_MS = 15000;

const jobPropTypes = PropTypes.shape({
    id: PropTypes.number.isRequired,
    action: PropTypes.oneOf(_.values(CONST.AGENT_DISPATCHER.ACTIONS)).isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['queued', 'running', 'done', 'failed']).isRequired,
    draft: PropTypes.string,
});

const POSTABLE_ACTIONS = [
    CONST.AGENT_DISPATCHER.ACTIONS.REPLY,
    CONST.AGENT_DISPATCHER.ACTIONS.UPDATE,
];

function resolveJob(id) {
    return fetch(CONST.AGENT_DISPATCHER.RESOLVE_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id}),
    });
}

function AgentDraftRow({job, onResolved}) {
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState(null);

    const approveAndPost = async () => {
        setIsPosting(true);
        setError(null);
        try {
            await API.addCommentToUrl(job.url, job.draft);
            await resolveJob(job.id);
            onResolved(job.id);
        } catch (postError) {
            setError('Posting failed — check the console');
            setIsPosting(false);
        }
    };

    const dismiss = async () => {
        try {
            await resolveJob(job.id);
        } finally {
            onResolved(job.id);
        }
    };

    const isPostable = job.status === 'done'
        && job.draft
        && _.contains(POSTABLE_ACTIONS, job.action);

    return (
        <div className="panel-item k2-draft-row">
            <span className="panel-item-meta">
                {job.status === 'running' && <span className="k2-workflow-menu-loader" />}
                {job.status === 'failed' && <span className="k2-update-due-badge">failed</span>}
                {isPostable && (
                    <button
                        type="button"
                        className="k2-agent-dispatch-button"
                        disabled={isPosting}
                        onClick={approveAndPost}
                        title="Post this draft as a comment using your GitHub token"
                    >
                        {isPosting ? 'Posting…' : '✓ Approve & post'}
                    </button>
                )}
                <button
                    type="button"
                    className="k2-agent-dispatch-button"
                    onClick={dismiss}
                    title="Discard this job"
                >
                    Dismiss
                </button>
            </span>

            <a href={job.url} className="issue" target="_blank" rel="noopener noreferrer">
                <sup>{job.action}</sup>
                {` ${job.title}`}
            </a>

            {error && <div className="k2-update-due-badge">{error}</div>}
            {job.status !== 'running' && job.draft && (
                <pre className="k2-draft-body">{job.draft}</pre>
            )}
        </div>
    );
}

AgentDraftRow.propTypes = {
    job: jobPropTypes.isRequired,
    onResolved: PropTypes.func.isRequired,
};
AgentDraftRow.displayName = 'AgentDraftRow';

function ListAgentDrafts() {
    const [jobs, setJobs] = useState(null);
    const jobsRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const fetchJobs = async () => {
            try {
                const response = await fetch(CONST.AGENT_DISPATCHER.JOBS_ENDPOINT);
                const payload = await response.json();
                if (isMounted) {
                    jobsRef.current = payload.jobs;
                    setJobs(payload.jobs);
                }
            } catch (error) {
                if (isMounted) {
                    jobsRef.current = null;
                    setJobs(null);
                }
            }
        };
        fetchJobs();
        const interval = setInterval(fetchJobs, POLL_INTERVAL_MS);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const removeJob = (id) => {
        jobsRef.current = _.reject(jobsRef.current, job => job.id === id);
        setJobs(jobsRef.current);
    };

    if (!jobs || !jobs.length) {
        return null;
    }

    return (
        <div className="panel agent-drafts mb-3">
            <Title text="Agent Drafts" count={jobs.length} />
            {_.map(jobs, job => (
                <AgentDraftRow key={job.id} job={job} onResolved={removeJob} />
            ))}
        </div>
    );
}

ListAgentDrafts.displayName = 'ListAgentDrafts';

export default ListAgentDrafts;
