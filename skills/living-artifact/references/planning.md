# Planning: tickets, PRs, milestones, waves

## A ticket is a goal and its proof

One outcome a person can see, sized so one strong agent owns it for a few hours to a day. It states the end state and how to prove it. It never scripts the steps: the agent reads the code, finds the way, and proves the goal itself. Spoon-fed steps make runs long and agents brittle.

Group by outcome and by the code area. Five fixes on one screen are one ticket. A large round has about 8 to 35 tickets. Each ticket becomes exactly one commit in exactly one PR.

| Field | Purpose | Good | Bad |
|---|---|---|---|
| title | The outcome, verb first, in the user's words | Make the sheet selector one full-canvas view everywhere | Remove popup branch in SheetMenu |
| problem | What hurts, in the user's terms | Every later open is a small popup, so people lose their place | Popup exists |
| goal | The end state and what must not change; never the steps | Every way in shows the same full-canvas view; the popup is gone | Step 1 edit X, step 2 add Y |
| done_when | Three to six checks a person or a test can prove | Header, G and footer open the same view, grouped by category | Selector works |
| verify | The test the agent writes and the browser walk it records | A component test per entry point; screenshot each at 1440 px | Manual QA |
| files | The area it touches, so PRs in a wave never collide | apps/web/components/viewer/ (page selector) | everything |
| risk | Review depth: low, medium, high | high for data deletion, auth, billing, migrations, prompts, client documents | |
| size | M (hours) or L (about a day). S is folded into its neighbour | | |
| pr | The category PR that carries it, as one commit | | |

Open tickets also carry, when the work is a fix: `where_found` (file and line, or the run where it showed), `reproduce` (steps anyone can follow), `solution`, `why_right` (why this fix and not another), `verify.run` (how to check it on a real system) and `estimate`.

## The PR plan: one PR per problem category

Size PRs by the problems they solve, never by a line budget. Group the round's tickets by category (security, the agent's behaviour, speed and cost, reliability, screens, finishing and documents, and so on), usually four to eight per round, and ship each category as one PR into the development branch. Inside the PR each ticket is one commit, so history, review and proof still read ticket by ticket.

Why not many small PRs: the small-PR studies measured people reading diffs and the blast radius of each deploy. Here the reviewers are agents and review happens on every commit before a PR exists. Each extra PR costs a CI run, a deploy of the development branch, a person's approval, and a rebase of every PR still open, and it splits one problem across reviews that never see the whole fix. Seventy small PRs for thirty tickets is overhead, not safety.

A category PR stays safe through what happens before it opens, not through a size cap:

- **A file plan.** Each PR names the areas it owns. Two PRs in the same wave never own the same files; PRs that must share a file run in order.
- **The ticket loop.** Every ticket is built and tested, then proven on the local stack and reviewed by a fresh agent before its commit is final; a ticket that fails is reset away before the next one starts (`run.md`).
- **The PR loop.** Once every commit is final, a whole-PR critical review and an end-to-end run of the PR's proof list on the local stack happen before the PR opens.
- **Files per PR.** State each PR's `size`: how many files it touches and the lines it should add and delete, with a reason when one PR is much larger than the rest. Hot files with tight limits (prompt token budgets, the one engine file) have one owner per wave; a PR that must edit one after its owner goes in a later wave.
- **A line accounting.** The PR body splits added and deleted lines into production, tests, and docs and config, per commit, with a reason for anything large. A bloat review deletes lines that serve no done-when before the PR opens.

Two rules come from the base, not the size:

- **Hotfix.** A fix production needs now ships as its own PR into the production branch, carrying only that commit, once the commit is proven in its category branch.
- **Drop, do not hold.** A ticket that cannot prove its done-when is reset away, marked blocked with the reason, and moves to the next round, with every ticket that depends on it. It never holds its PR.
- **Baselines.** A graded comparison needs a baseline run on the unchanged development branch with the same inputs and a reset memory, planned and costed before wave 1. Results from other environments or older memory are context, never the bar.
- **Evidence privacy.** Proof that shows customer material stays in a private folder the book names; only made-up test data appears in screenshots on the page or in a PR.

`plan.prs` lists each PR: title, category, the problem it solves, the outcome after it merges, wave, base, branch, its tickets in commit order, the areas it owns, the PRs it depends on, its risk (the highest of its tickets), who approves it, and the proof shown before it opens. State `plan.flow` (the ticket loop and the PR loop), `plan.pr_template` (the PR body headings), `review_policy`, `merge_checklist`, and the repository settings to change first in `plan.github`. Merge with a merge commit: it keeps each ticket's reviewed commit with the same id, so one ticket can be reverted alone. A squash loses the tickets; a rebase merge rewrites every commit id.

**Shared lines.** Two PRs in the same wave never own the same area. A few lines in a file that another PR also edits are allowed when the PR lists that file in `shares`; the second to merge rebases and runs its checks again. Hot files with tight limits (prompts near their token budget, one engine file every category touches) belong to one owner per wave.

## Estimates are agent time

Never human days. Say three numbers in plain words: agent build time (with parallel PR builders, the longest lane sets the wall clock), the merge line (PRs merge one at a time; each waits for its checks and, where the repo deploys on merge, for that deploy), and human review (one approval per PR, so the count of PRs is the count of approvals). A ticket's `estimate` reads like "2 h build, 30 min review".

## Milestones

Three to seven. Each is an outcome a person can see working ("Anyone can search the docs from any page"), never a layer ("backend"). Each has a goal, done-when statements, and the PRs whose merge reaches it. A milestone's done-when is usually its outcome claim's.

## Waves

1. A wave holds PRs that can be built at the same time: no shared files and no dependency between them.
2. One builder owns one PR and works its tickets in commit order. A ticket may depend on an earlier ticket in its own PR, or on any ticket in a PR from an earlier wave that its PR is built on. A PR that needs two or more PRs of earlier waves is built on a local integration branch of them and opens after they merge.
3. Six PRs per wave at most unless the user raised it.
4. Foundations first (the checks every PR needs, security, data and contracts), the agent's behaviour and screens next, documents and measurement last.
5. Two to four waves for a large round. A wave that exists only for one small PR is a smell.
6. Everything that proves work on a running app shares one local stack and one browser. Builders write code and run tests in parallel; browser proof and end-to-end runs take turns on the one stack (`run.md`).
7. Every wave ends with the gate (see `run.md`). Say on the page what the gate checks.

The wave plan on the page is the centre of the Plan section: waves as columns, each PR a block with its category, ticket count, risk and approver, arrows for dependencies, and the gate between waves.

## Decisions

Only choices no experiment can settle and the user owns: names, scope, taste, cost, risk. Each has the question, why it matters, two to four options with the effect of each ("this ticket goes", "adds one wave"), a recommendation, `attach` (the ticket, PR or milestone it changes) and `blocks` (tickets that cannot start without it). Two to seven per round. Facts are found, not asked. Never ask the user to do set-up work that access already covers (making test data, uploading files, creating accounts the agent can create itself).

## Verification points

| Where | What |
|---|---|
| Every ticket, before its commit is final | Area tests and type checks green; each done-when proven (a browser walk on the local stack for screens, a replay or a run for agent behaviour); a fresh reviewer read the diff; findings fixed |
| Every PR, before it opens | All ticket commits final; a whole-PR review for correctness, simplicity and bloat, and security, with a refuter; an end-to-end run of the PR's proof list on the local stack; the line accounting written |
| Every PR, on the code host | Required checks green on the latest commit; the merge by the person the book names |
| After each merge | The development branch deploys; the lead spot checks one done-when per ticket there |
| After the last wave | Every outcome walked end to end, real data runs where the book names them, the cold attention review, the report |

## Simplicity rules builders carry

- The fewest lines that meet the done-when. Reuse what exists; prefer the official primitive or library over our own.
- Delete code and tests the change makes dead. Net negative lines is a good sign.
- Tests prove behaviour a person cares about. No tests that restate the code, no snapshot dumps, no tests for deleted code.
- No new dependency without a line in the ticket's notes saying why.

## The checker

`node scripts/build.mjs <book-dir>` refuses: an unknown milestone, wave, PR or dependency; a ticket in no PR or in two; a PR that depends on a PR in the same or a later wave; a ticket that depends on a later ticket in its own PR or on a PR in the same or a later wave; a recommendation that is not an option; a dash; a missing file. It also refuses architecture steps that name nodes missing from their diagram and summary links to nothing. It warns on S tickets, two PRs in one wave that own the same area, more than six PRs in a wave, outcomes without done-when, a missing summary, an area without found, recommend or why, and a page over 400 KB. Fix every error and warning before publishing.
