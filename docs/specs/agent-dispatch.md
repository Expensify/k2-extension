# Agent dispatch buttons

## Problem

K2 shows what needs attention, but acting on an item still means a manual
context switch: open the thread, reconstruct context, write the reply or do the
review. The agent side already exists as local Claude skills (`/review-pr`,
`/babysit-pr`); K2 has no way to hand work to them.

## Behavior

- List items get a dispatch button in their meta area:
  - Needs Reply issue → **Draft reply**
  - PR in Review PRs → **Review**
  - PR in Your Pull Requests → **Babysit**
- Clicking POSTs `{action, url, title}` to a local dispatcher at
  `http://127.0.0.1:8424/dispatch`.
- The dispatcher (`tools/k2Dispatcher.mjs`) appends the job to
  `~/.k2/dispatch-queue.jsonl` and launches the matching headless `claude`
  command. Output is written to `~/.k2/results/<timestamp>-<action>.md` and
  kept in memory for the review loop below.
- The button shows a spinner while posting, ✓ when the dispatcher accepted the
  job, ✗ when the dispatcher isn't running (tooltip says how to start it).

## Batch dispatch

- Needs Reply, Updates Due, and Review PRs have a **Dispatch all (N)** button
  in the panel title that dispatches every visible item at once.
- The dispatcher runs at most 3 `claude` jobs concurrently
  (`--concurrency N` to change); the rest wait as `queued` and start as slots
  free up, so a 15-item batch never launches 15 processes.
- Your Pull Requests deliberately has no batch button: babysit acts on GitHub
  (pushes fixes, replies to bots), so batching it would turn one click into
  unreviewed outbound actions on every open PR.

## Reviewing the results

The dashboard closes the loop in an **Agent Drafts** panel (top of the page,
hidden when there are no jobs):

- The panel polls the dispatcher's `GET /jobs` every 15 seconds; running jobs
  show a spinner, finished jobs show the agent's output inline.
- `reply` and `update` drafts get an **Approve & post** button that posts the
  draft as a comment using the user's own GitHub token (the same octokit the
  rest of K2 uses — the dispatcher never writes to GitHub for these actions).
- Every job has **Dismiss**. Both buttons `POST /resolve` so the job leaves
  the queue; the dispatcher holds jobs in memory until resolved.
- `review`/`babysit` output is shown read-only (those skills act through their
  own flow; their text is a report, not a comment to post).

## Design notes

- The content script fetches `127.0.0.1` directly: loopback is exempt from
  mixed-content blocking in Chrome and Firefox, and the dispatcher answers CORS
  preflights, so no background-worker relay or new manifest permissions are
  needed.
- Action → command map lives in the dispatcher, not the extension, so prompts
  can change without an extension release:
  - `reply` → `claude -p "Draft a reply to the latest mention …"` (prints a
    draft, posts nothing)
  - `review` → `claude -p "/review-pr <url>"`
  - `babysit` → `claude -p "/babysit-pr <url>"`
- The dispatcher ignores a repeated `{action, url}` within 10 minutes
  (double-click and re-poll guard) and only accepts `https://github.com/…`
  URLs.
- The dispatcher binds to `127.0.0.1` only; anything that can reach it is
  already running as the user.

## Run it

```
node tools/k2Dispatcher.mjs [--dry-run] [--port 8424]
```

`--dry-run` queues jobs without launching `claude`.

## Out of scope (next steps)

- Permission management for headless runs: actions that need tools (babysit,
  review) rely on pre-approved allowlists in the user's Claude settings;
  denied tools in `-p` mode fail silently and degrade draft quality.
- Editing a draft in the panel before posting (workaround: copy, dismiss,
  paste on GitHub).
- Job persistence across dispatcher restarts (in-memory today; the JSONL
  queue and results files survive, the panel state does not).
- Per-action model/effort configuration.
