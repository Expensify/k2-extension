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
  command. Output is written to `~/.k2/results/<timestamp>-<action>.md`.
- The button shows a spinner while posting, ✓ when the dispatcher accepted the
  job, ✗ when the dispatcher isn't running (tooltip says how to start it).

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

- Surfacing job status and results back into K2 (a `GET /jobs` endpoint the
  dashboard polls).
- Permission management for headless runs: actions that write to GitHub
  (babysit) need pre-approved tool allowlists in the user's Claude settings.
- Per-action model/effort configuration.
