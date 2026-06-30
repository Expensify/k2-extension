/* global describe, it, expect */
import * as IssueOwner from '../issueOwner';

const ownerBody = 'Some text\n<details><summary>Issue Owner</summary>Current Issue Owner: @alice</details>';

describe('parseIssueOwner', () => {
    it('returns the owner login from the issue body', () => {
        expect(IssueOwner.parseIssueOwner(ownerBody)).toBe('alice');
    });

    it('returns null when no owner is present', () => {
        expect(IssueOwner.parseIssueOwner('No owner here')).toBeNull();
    });

    it('returns null for an empty or missing body', () => {
        expect(IssueOwner.parseIssueOwner('')).toBeNull();
        expect(IssueOwner.parseIssueOwner(undefined)).toBeNull();
    });
});

describe('resolveIssueOwner', () => {
    const currentUser = 'neil-marcellini';

    it('counts the owner only when they are also an assignee', () => {
        const assignees = [{login: 'alice'}, {login: currentUser}];
        expect(IssueOwner.resolveIssueOwner(ownerBody, assignees, currentUser)).toEqual({
            issueHasOwner: true,
            currentUserIsOwner: false,
        });
    });

    it('does not count a stale owner who is no longer an assignee', () => {
        const assignees = [{login: currentUser}];
        expect(IssueOwner.resolveIssueOwner(ownerBody, assignees, currentUser)).toEqual({
            issueHasOwner: false,
            currentUserIsOwner: false,
        });
    });

    it('marks the current user as owner when they own and are assigned', () => {
        const body = 'Current Issue Owner: @neil-marcellini';
        const assignees = [{login: currentUser}, {login: 'alice'}];
        expect(IssueOwner.resolveIssueOwner(body, assignees, currentUser)).toEqual({
            issueHasOwner: true,
            currentUserIsOwner: true,
        });
    });

    it('reports no owner when the body has none', () => {
        const assignees = [{login: currentUser}];
        expect(IssueOwner.resolveIssueOwner('No owner', assignees, currentUser)).toEqual({
            issueHasOwner: false,
            currentUserIsOwner: false,
        });
    });

    it('handles a missing assignees list', () => {
        expect(IssueOwner.resolveIssueOwner(ownerBody, undefined, currentUser)).toEqual({
            issueHasOwner: false,
            currentUserIsOwner: false,
        });
    });
});
