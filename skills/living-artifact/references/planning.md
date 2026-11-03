# Planning: tickets, milestones, waves

## A ticket is a goal and its proof

One outcome a person can see, sized so one strong agent owns it for a few hours to a day. It states the end state and how to prove it. It never scripts the steps: the agent reads the code, finds the way, and proves the goal itself. Spoon-fed steps make runs long and agents brittle.

Group by outcome and by the code area. Five fixes on one screen are one ticket. A large round has about 8 to 20 tickets.

| Field | Purpose | Good | Bad |
|---|---|---|---|
| title | The outcome, verb first, in the user's words | Make the sheet selector one full-canvas view everywhere | Remove popup branch in SheetMenu |
| problem | What hurts, in the user's terms | Every later open is a small popup, so people lose their place | Popup exists |
| goal | The end state and what must not change; never the steps | Every way in shows the same full-canvas view; the popup is gone | Step 1 edit X, step 2 add Y |
| done_when | Three to six checks a person or a test can prove | Header, G and footer open the same view, grouped by category | Selector works |
| verify | The test the agent writes and the browser walk it records | A component test per entry point; screenshot each at 1440 px | Manual QA |
| files | The area it owns, so agents in a wave never collide | apps/web/components/viewer/ (page selector) | everything |
| risk | Review depth: low, medium, high | high for data deletion, auth, billing, migrations, prompts | |
| size | M (hours) or L (about a day). S is folded into its neighbour | | |

Open tickets also carry, when the work is a fix: `where_found` (file and line, or the run where it showed), `reproduce` (steps anyone can follow), `solution`, `why_right` (why this fix and not another), `verify.run` (how to check it on a real system) and `estimate`.

## Estimates are agent time

Never human days. Say three numbers in plain words: agent build time (with parallel builders, the longest lane sets the wall clock), the merge line (PRs merge one at a time; each waits for its checks, so count checks per PR times the success rate of CI), and human review (only high-risk PRs wait for a person). A ticket's `estimate` reads like "2 h build, 30 min review".

## The PR plan

Each ticket ships as one PR or a stack of two to four (`plan.prs`), about 200 to 400 changed lines each, into the development branch (`plan.branches`). Independent PRs have the development branch as base and merge in any order. A stack is for one goal too big to review at once, where each part needs the one below; it merges bottom first. Prefer independent PRs: a stack makes later PRs wait. State `review_policy` by risk and the `merge_checklist` every PR must pass, and list the repository settings to change first in `plan.github`. The page groups PRs by wave, with stacks drawn as chains.

## Milestones

Three to seven. Each is an outcome a person can see working ("Anyone can search the docs from any page"), never a layer ("backend"). Each has a goal and done-when statements. A milestone's done-when is usually its outcome claim's.

## Waves

1. Order tickets by dependency. Tickets with no dependency between them run in the same wave.
2. One builder per ticket, two at most when two tickets share one area. Six builders per wave unless the user raised it.
3. No two builders in a wave touch the same files. If they must, merge the tickets or split the waves.
4. Foundations first (merges, data, contracts, server routes), screens next, proof and docs last.
5. Two to four waves for a large round. A wave that exists only for one small ticket is a smell.
6. Every wave ends with the gate (see `run.md`). Say on the page what the gate checks.

The wave diagram on the page shows lanes per wave, one bar per builder, arrows for dependencies, and the gate between waves.

## Decisions

Only choices no experiment can settle and the user owns: names, scope, taste, cost, risk. Each has the question, why it matters, two to four options with the effect of each ("this ticket goes", "adds one wave"), a recommendation, `attach` (the ticket or milestone it changes) and `blocks` (tickets that cannot start without it). Two to seven per round. Facts are found, not asked.

## Verification points

| Where | What |
|---|---|
| Every ticket | The builder's test and its own browser walk with screenshots, before it says done |
| Every PR | Required checks green on its latest commit, proof for each done-when in the body, review by risk with no open important finding, a person's approval when high risk |
| Every wave | The lead's spot check of one done-when per ticket on the merged development branch |
| After the last wave | Every outcome walked end to end, real data runs, the cold attention review, the fix loop until a pass finds nothing new |

## Simplicity rules builders carry

- The fewest lines that meet the done-when. Reuse what exists; prefer the official primitive or library over our own.
- Delete code and tests the change makes dead. Net negative lines is a good sign.
- Tests prove behaviour a person cares about. No tests that restate the code, no snapshot dumps, no tests for deleted code.
- No new dependency without a line in the ticket's notes saying why.

## The checker

`node scripts/build.mjs <book-dir>` refuses: unknown milestone, wave, agent or dependency; a dependency in the same or a later wave; a recommendation that is not an option; a dash; a missing file. It also refuses architecture steps that name nodes missing from their diagram, PRs with unknown tickets or bases, summary links to nothing, and PRs over 1500 lines with no reason. It warns on S tickets, more than two tickets per agent per wave, more than 24 tickets, outcomes without done-when, a missing summary, an area without found, recommend or why, a ticket with no PR, a PR over 400 lines, and a page over 400 KB. Fix every error and warning before publishing.
