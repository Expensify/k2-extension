# Impact-ranked ordering

## Problem

K2 panels mostly order by recency (`updatedAt`), and the two panels that do
score by priority (Hot Picks, Engineering) each carry their own copy of the
scoring logic with no notion of deploy blockers or fires. Recency ordering
optimizes for "what changed last", not "what matters most" — a Monthly issue
with a fresh comment outranks a DeployBlocker from this morning.

## Behavior

One shared scorer (`lib/issueImpactScore.js`) orders issues by company impact:

1. **DeployBlocker / DeployBlockerCash / DeployBlockerMobile** — gates every
   deploy, everyone is blocked
2. **Fire Cleanup** — critical fire follow-up
3. **Hourly → Daily → Weekly → Monthly** — the K2 cadence ladder
4. Within a tier: WhatsNext, then FirstPick/Improvement/Task/NewFeature
   modifiers (unchanged from the previous Hot Picks/Engineering weights)
5. Age as tiebreaker — older first, so nothing rots at the bottom of a tier

Applied to:

- **Needs Reply** — previously newest-updated first; now the reply that
  unblocks a deploy or a fire is at the top, and within a tier the oldest
  unanswered mention comes first.
- **Hot Picks** and **Engineering** — same ordering as before for the labels
  they already scored, plus the new DeployBlocker/Fire Cleanup tiers, and both
  now share the one scorer instead of diverging copies.

## Design notes

- Weights are spaced by powers of ten so tiers never interleave; the age term
  is `age / 100` (days), too small to cross tiers.
- The previous inline scorers read `item.created_at`, which does not exist on
  the GraphQL results (`createdAt`) — age was silently contributing zero. The
  shared scorer reads `createdAt`, so the age tiebreaker now actually works.

## Out of scope (next steps)

- Applying impact order to Your Issues (it has manual drag-ordering per
  priority group; reconciling the two needs its own design).
- Weighting by engagement (comment velocity, number of blocked people).
