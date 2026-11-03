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

Rules every PR follows, whatever its size:

- **One stack, open until the end.** PRs stack in one line in the order they open: the first opens into the development branch, every later one into the branch of the PR opened before it. The run never waits for a merge, so every PR can still be open when the report is written; the person merges them bottom first, each with a merge commit, whenever they choose, and each merged branch is deleted (by the repository setting, or by the Delete branch the merge checklist names) so the next PR moves onto the development branch. Waves decide what is built at the same time; the stack only decides the order PRs open and merge, so a PR's `base` may be a PR of its own wave.
- **Hotfix.** A fix production needs now ships as its own PR into the production branch, carrying only that commit, opened by the lead once its category PR opens. Whether it is released is the person's call.
- **Drop, do not hold.** A ticket that cannot prove its done-when is reset away, marked blocked with the reason, and moves to the next round, with every ticket that depends on it. It never holds its PR.
- **Done-when the run can prove.** `done_when` holds only what the run can show before any merge: on the local stack, in tests, in the ticket's own proof. What only the person's merge, a deploy or a release can show goes in the ticket's `after_merge`, which the report lists for the person. A PR body is written after the ticket is final, so a ticket never waits on its PR's text.
- **Baselines.** A graded comparison needs a baseline run on the unchanged development branch with the same inputs and a reset memory, planned and costed before wave 1. Results from other environments or older memory are context, never the bar.
- **Evidence privacy.** Proof that shows customer material stays in a private folder the book names; only made-up test data appears in screenshots on the page or in a PR.

`plan.prs` lists each PR: title, category, the problem it solves, the outcome after it merges, wave, base, branch, its tickets in commit order, the areas it owns, the PRs it depends on, its risk (the highest of its tickets), who approves it, and the proof shown before it opens. State `plan.flow` (the ticket loop and the PR loop), `plan.pr_template` (the PR body headings), `review_policy`, `merge_checklist`, and the repository settings to change first in `plan.github`. Merge with a merge commit: it keeps each ticket's reviewed commit with the same id, so one ticket can be reverted alone. A squash loses the tickets; a rebase merge rewrites every commit id.

**Shared lines.** Two PRs in the same wave never own the same area. A few lines in a file that another PR also edits are allowed when the PR lists that file in `shares`; the later one in the stack resolves them when it rebases onto the stack before opening, and runs its checks again. Hot files with tight limits (prompts near their token budget, one engine file every category touches) belong to one owner per wave.

## Estimates are agent time

Never human days. Say three numbers in plain words: agent build time (with parallel PR builders, the longest lane sets the wall clock), the merge line (after the run, PRs merge one at a time, bottom of the stack first; each waits for its checks and, where the repo deploys on merge, for that deploy), and human review (one approval per PR, so the count of PRs is the count of approvals). A ticket's `estimate` reads like "2 h build, 30 min review".

## Milestones

Three to seven. Each is an outcome a person can see working ("Anyone can search the docs from any page"), never a layer ("backend"). Each has a goal, done-when statements, and the PRs whose merge reaches it. A milestone's done-when is usually its outcome claim's.

## Waves

1. A wave holds PRs that can be built at the same time: no shared files and no dependency between them.
2. One builder owns one PR and works its tickets in commit order. A ticket may depend on an earlier ticket in its own PR, or on any ticket in a PR from an earlier wave. A PR is built from the top of the stack when its wave starts, so it already holds every earlier PR it needs.
3. Six PRs per wave at most unless the user raised it.
4. Foundations first (the checks every PR needs, security, data and contracts), the agent's behaviour and screens next, documents and measurement last.
5. Two to four waves for a large round. A wave that exists only for one small PR is a smell.
6. Everything that proves work on a running app shares one local stack and one browser. Builders write code and run tests in parallel; browser proof and end-to-end runs take turns on the one stack (`run.md`).
7. Every wave ends with the gate (see `run.md`). Say on the page what the gate checks.

The wave plan on the page is the centre of the Plan section: waves as columns, each PR a block with its category, ticket count, risk and approver, arrows for dependencies, and the gate between waves.

## Decisions

Only choices no experiment can settle and the user owns: names, scope, taste, cost, risk. Each has the question, why it matters, two to four options with the effect of each ("this ticket goes", "adds one wave"), a recommendation, `attach` (the ticket, PR or milestone it changes) and `blocks` (tickets that cannot start without it). Two to seven per round. Facts are found, not asked. Never ask the user to do set-up work that access already covers (making test data, uploading files, creating accounts the agent can create itself).

## The verification plan

Agree how the work will be proven before anything is built, and keep it small. `plan.verification` (`data-model.md`) has four parts; the page shows them in How we prove it, and approving the plan agrees them.

1. **Ready before the run.** Everything the checks need, each with how the lead proves it is there and who supplies it: the local stack starts on the newest code, the accounts and keys the product calls, signed-in command-line tools, the test Projects and their files, the private answer keys, baselines, the browser and any app access a person must approve, the settings a check relies on, the spend. Probe what you can while planning and set `state`; the run probes them all again before wave 1 and stops on a missing one. "Safe to start" means every item a person must supply is there and confirmed.
2. **While it is built.** The checks agents run on their own (the ticket loop, the PR loop, CI). One row each; they are the floor, not the proof.
3. **After everything is built.** The final pass runs once, on a fresh copy of the product built from the top of the stack, so it holds every PR. Every ticket appears in at least one check. Each check says in plain words how it should work (`expect`) and what counts as passing (`pass`). Pick the cheapest kind that truly proves the behaviour:
   - `code`: a test, a search of the code, a read-only command (a key is gone from the repo, a setting is read from the right place).
   - `screen`: open one screen and look (a setting saves, a template shows).
   - `watch`: seen while a real run goes (how the agent orients, asks, measures, prices, finishes).
   - `ask`: a person types a request in the chat mid-run. Use these where the normal run would not touch a path, and to test the product's promise when it is agent-led: anything a person can reasonably say is done or answered with a reason, never refused because code forbids it. The pass line accepts a reasoned answer the product's own rules require (a setting that forbids it, a needed fact it asks for) and fails a refusal by rule.
   - `measure`: compared with the baseline run on the same inputs (accuracy against a private key, time, cost). A measure is taken before any ask changes the estimate.
4. **Runs.** The real runs the live checks share, each with its Project, how far it goes, cost and time. One to three per round; every watch, ask and measure check names one, and a screen check names the run whose Project it needs. A run that is worth doing only when an earlier one held names it in `needs`.

Keep it reasonable: one check can cover several tickets; reuse the round's existing tests and its proof runs; no new test frameworks; aim for roughly one check per two tickets (the checker warns past three for every four), and say the total cost and time in `summary`, baselines included. Cover each high-risk ticket's failure path, not only its happy path. A check whose pass line depends on an open decision says so, so the decision's answer cannot fail it.

**Done means proven.** A ticket is `built` once its own proof and review pass, and `done` only when its final check passes. A check that fails gets one fix round inside the stack (`run.md`, a fix to a PR lower in the stack), then is checked again; if it still fails, or never ran, the report says so plainly under not proven. Evidence showing customer material stays private; the page gets the verdict in words.

## Simplicity rules builders carry

- The fewest lines that meet the done-when. Reuse what exists; prefer the official primitive or library over our own.
- Delete code and tests the change makes dead. Net negative lines is a good sign.
- Tests prove behaviour a person cares about. No tests that restate the code, no snapshot dumps, no tests for deleted code.
- No new dependency without a line in the ticket's notes saying why.

## The checker

`node scripts/build.mjs <book-dir>` refuses: an unknown milestone, wave, PR or dependency; a ticket in no PR or in two; a PR that depends on a PR in the same or a later wave; a PR stacked on one from a later wave, or a stack that loops; a ticket that depends on a later ticket in its own PR or on a PR in the same or a later wave; an id that collides with a live status document; a recommendation that is not an option; a dash; a missing file; a final check with an unknown ticket or run, an ask check without the words a person types, a run that needs a later run, and, once checks exist, a ticket that no check covers. It also refuses architecture steps that name nodes missing from their diagram and summary links to nothing. It warns on S tickets, a stack that branches (two PRs on one base), two PRs in one wave that own the same area, more than six PRs in a wave, more than three checks for every four tickets, a measure check with no baseline among the ready items, outcomes without done-when, a plan with no final checks yet, a missing summary, an area without found, recommend or why, and a page over 400 KB. Fix every error and warning before publishing.
