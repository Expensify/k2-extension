# Stall detection and nudge

## Problem

The slowest part of shipping is usually waiting. A PR that has sat with a
reviewer for days looks identical in K2 to one that got reviewed an hour ago,
so stalls are only noticed when the author happens to remember. Review latency
gates cycle time more than anything else the dashboard shows.

## Behavior

- In Your Pull Requests, a PR counts as **stalled** when all of:
  - it is not a draft and its title has no `[HOLD` / `[WIP` marker
  - its review decision is `REVIEW_REQUIRED`
  - it has had no activity for `CONST.PR_STALL_THRESHOLD_DAYS` (2) days
- Stalled rows get a "stalled Nd" badge and a **Nudge** button.
- Clicking Nudge posts one comment on the PR mentioning the requested
  reviewers: "@a @b Friendly bump 🙏 — this PR has been waiting on review for
  N days." The button shows ✓ when posted, ✗ on failure.

## Design notes

- "Waiting since" uses `updatedAt`, which any activity resets — including the
  author's own pushes — so the badge measures quiet time, not strictly
  time-since-review-request. Good enough to surface stalls; precise
  review-request timestamps would need the timeline API.
- `reviewRequests(first: 10)` is added to the PR list query for the mentions.
  Only User reviewers are mentioned; team review requests are skipped.
- A nudge is one comment per click, no auto-repeat — nagging stays a human
  decision.

## Out of scope (next steps)

- Auto-nudge cadence or escalation (e.g. Slack after a second quiet period).
- Detecting stalls on PRs where the user is the quiet reviewer (the Review
  PRs panel is already that queue).
- Suppressing the badge after a recent nudge.
