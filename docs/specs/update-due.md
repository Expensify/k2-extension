# Updates Due panel

## Problem

Expensify's K2 labels (Hourly/Daily/Weekly/Monthly) imply how often an issue
owner is expected to post a status update. Remembering which issues owe an
update is unaided toil today; missing one ends in a bot ping or a K2 meeting
mention. K2 already fetches everything needed to compute this.

## Behavior

- A new "Updates Due" panel lists assigned issues where the current user's
  last comment is older than the label's cadence:
  Hourly → 1 day, Daily → 2 days, Weekly → 7 days, Monthly → 30 days
  (`CONST.UPDATE_CADENCE_DAYS`).
- Each row shows the issue plus a badge: "due today" or "Nd overdue", sorted
  most-overdue first.
- Each row gets a **Draft update** dispatch button (`update` action): the
  dispatcher asks Claude to draft a status-update comment from the issue's
  activity since the user's last comment. Nothing is posted automatically.
- The panel hides itself when nothing is due.

## What counts as "owing an update"

- The issue is assigned to the current user and has a cadence label.
- Issues owned by someone else (a `Current Issue Owner:` line naming another
  assignee) are skipped — the update is theirs to give.
- `[HOLD]` titles are skipped.
- "Last update" = the user's most recent comment (falling back to the issue's
  creation date if they have never commented).

## Design notes

- Data comes from the same fetch as the Your Issues panel
  (`Issues.getAllAssigned` → `ISSUES.ASSIGNED` in Onyx); the panel polls the
  same throttled action, so no extra API traffic beyond its own interval.
- The assigned-issues query fetches the last 15 comments. If the user's last
  update is buried deeper than that, the issue is flagged anyway — the failure
  direction is a false "due", never a false "all clear".

## Out of scope (next steps)

- Business-day cadence (weekends currently count).
- A "snooze" affordance.
- Auto-posting the drafted update after approval.
