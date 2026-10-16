import _ from 'underscore';
import React from 'react';
import * as API from '../../lib/api';

// These are the `d` attributes of the 16px GitHub octicons for each pull request state.
/* eslint-disable max-len */
const ICONS = {
    open: {
        name: 'Open',
        path: 'M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z',
    },
    draft: {
        name: 'Draft',
        path: 'M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 14a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM14 7.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0-4.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z',
    },
    merged: {
        name: 'Merged',
        path: 'M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z',
    },
    closed: {
        name: 'Closed',
        path: 'M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.97.97.97.97a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z',
    },
};
/* eslint-enable max-len */

/**
 * @param {Object} pullRequest
 * @returns {String} One of the keys in ICONS
 */
function getPullRequestState(pullRequest) {
    if (pullRequest.state === 'MERGED') {
        return 'merged';
    }
    if (pullRequest.state === 'CLOSED') {
        return 'closed';
    }
    return pullRequest.isDraft ? 'draft' : 'open';
}

class PullRequestList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            hasError: false,
            pullRequests: [],
        };
    }

    componentDidMount() {
        API.getCurrentIssuePullRequests()
            .then(pullRequests => this.setState({isLoading: false, pullRequests}))
            .catch((e) => {
                console.error(e);
                this.setState({isLoading: false, hasError: true});
            });
    }

    renderContent() {
        if (this.state.isLoading) {
            return <div className="k2-linked-prs-message">Loading…</div>;
        }
        if (this.state.hasError) {
            return <div className="k2-linked-prs-message">Could not load pull requests</div>;
        }
        if (!this.state.pullRequests.length) {
            return <div className="k2-linked-prs-message">No pull requests</div>;
        }

        return (
            <ul className="k2-linked-prs">
                {_.map(this.state.pullRequests, (pullRequest) => {
                    const state = getPullRequestState(pullRequest);
                    const author = pullRequest.author;
                    return (
                        <li key={pullRequest.url}>
                            <a
                                href={pullRequest.url}
                                className={`k2-linked-pr k2-linked-pr-${state}`}
                                title={`${ICONS[state].name}: ${pullRequest.title}`}
                            >
                                <svg
                                    className="k2-linked-pr-icon"
                                    viewBox="0 0 16 16"
                                    width="16"
                                    height="16"
                                    aria-label={ICONS[state].name}
                                    role="img"
                                >
                                    <path d={ICONS[state].path} />
                                </svg>
                                <span className="k2-linked-pr-details">
                                    <span className="k2-linked-pr-title">{pullRequest.title}</span>
                                    <span className="k2-linked-pr-meta">
                                        {`${pullRequest.repository.name}#${pullRequest.number}`}
                                        {author && (
                                            <>
                                                {' by '}
                                                <img className="k2-linked-pr-avatar" src={author.avatarUrl} alt="" width="16" height="16" />
                                                {author.login}
                                            </>
                                        )}
                                    </span>
                                </span>
                            </a>
                        </li>
                    );
                })}
            </ul>
        );
    }

    render() {
        return (
            <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>Pull Requests</label>
                {this.renderContent()}
            </div>
        );
    }
}

export default PullRequestList;
