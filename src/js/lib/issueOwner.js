import _ from 'underscore';

const ISSUE_OWNER_REGEX = /Current Issue Owner:\s@(?<owner>[a-z0-9-]+)/i;

/**
 * Parse the issue owner's GitHub login from an issue body.
 *
 * @param {String} [issueBody]
 * @returns {String|null} the owner's login, or null when there isn't one
 */
function parseIssueOwner(issueBody) {
    const regexResult = (issueBody || '').match(ISSUE_OWNER_REGEX);
    return (regexResult && regexResult.groups && regexResult.groups.owner) || null;
}

/**
 * Resolve the effective owner of an issue. An owner only counts when they are also an assignee,
 * matching the overdue issue meeting logic. This keeps a stale owner (still in the body but no
 * longer assigned) from being treated as the owner.
 *
 * @param {String} [issueBody]
 * @param {Array} [assignees] assignee objects, each with a `login`
 * @param {String} currentUser the current user's GitHub login
 * @returns {Object} {issueHasOwner: Boolean, currentUserIsOwner: Boolean}
 */
function resolveIssueOwner(issueBody, assignees, currentUser) {
    const parsedOwner = parseIssueOwner(issueBody);
    const assigneeLogins = _.pluck(assignees || [], 'login');
    const ownerIsAssigned = !!parsedOwner && _.contains(assigneeLogins, parsedOwner);
    const effectiveOwner = ownerIsAssigned ? parsedOwner : null;

    return {
        issueHasOwner: !!effectiveOwner,
        currentUserIsOwner: !!effectiveOwner && effectiveOwner === currentUser,
    };
}

export {
    parseIssueOwner,
    resolveIssueOwner,
};
