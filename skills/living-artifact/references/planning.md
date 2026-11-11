# Planning: work, steps, pull requests, proof

## A piece of work is a goal and its proof

One outcome a person can see, sized so one strong agent owns it for a few hours to a day. It states the end state and how to prove it, never the steps: the agent reads the code, finds the way and proves the goal. Group by outcome and code area; five fixes on one screen are one ticket. A large round has about 8 to 35.

| Field | Purpose | Good | Bad |
|---|---|---|---|
| `title` | The outcome in plain words, verb first, 10 words. The one name used everywhere | Exports run as background jobs with a record | Add ExportJob worker |
| `goal` | The end state and what must not change, 30 words | Any export runs outside the web request, and every run leaves one record | Step 1 edit X, step 2 add Y |
| `done_when` | Two to five checks a person or a test can prove, 15 words each | A month of 2,000 invoices finishes while the app stays fast | Export works |
| `after_merge` | What only a merge, deploy or release can show. Listed for the person, never proven by the run | Production export finishes on the first real month end | |
| `depends_on` | Earlier tickets it needs | | |
| `files` | The area it touches, so parallel work never collides | apps/api/src/jobs/ | everything |
| `risk` | Review depth: `low`, `medium`, `high` | high for data deletion, auth, billing, migrations, prompts | |
| `size` | `M` (hours) or `L` (about a day). Fold `S` into a neighbour | | |
| `file` | `agent/tickets/<id>.md` for longer notes: where found, how to reproduce, the fix and why | | |

Only `title`, `goal` and `done_when` show to a person. Everything else is agent mode.

## Steps

`plan.waves` are the steps a person sees on the build timeline: `{ n, id, name, what, prs }`, with `name` two plain words ("Jobs") and `what` eight words on what the step gives ("Exports run as jobs that survive restarts").

1. A step holds work that can be built at the same time: no shared files, no dependency between its parallel lanes.
2. Foundations first (the checks every later piece needs, security, data and contracts), then behaviour and screens, then documents and measurement.
3. Two to four steps for a large round. A step that exists for one small ticket is a smell.
4. Everything that proves work on a running app shares one local stack and one browser; builders code in parallel, proof takes turns.
5. Every step ends with its gate (`run.md`).

## Pull requests (agent mode)

When the work ships through pull requests, size them by problem category, never by a line budget: usually four to eight per round (security, reliability, screens, documents...), each ticket one commit. Every extra PR costs a CI run, a deploy, an approval and a rebase of every PR still open; review happens per commit before a PR exists, so size follows the problem.

`plan.prs[]`: `{ id, title, category, wave, base, branch, tickets (commit order), areas, shares, depends_on, risk, approver, proof, hotfix }`. A ticket's step is its PR's `wave`. Without PRs a ticket names its step in `wave`.

- **One stack, open until the end.** The first PR opens into the development branch, each later one into the branch of the PR opened before it. The run never waits for a merge; the person merges bottom first with a merge commit (a squash loses the tickets, a rebase merge rewrites the reviewed commit ids).
- **File plan.** PRs in one step never own the same `areas`. A few lines another PR also edits go in `shares`; the later one resolves them when it rebases. Hot files with tight limits have one owner per step.
- **Drop, do not hold.** A ticket that cannot prove its done-when after two fix rounds is reset away, marked blocked with the reason, and moves to the next round with everything that depends on it.
- **Hotfix.** A fix production needs now ships as its own PR into the production branch, carrying only that commit.
- **Baselines.** A graded comparison needs a baseline run on unchanged code with the same inputs, planned and costed before the first step.
- **Evidence privacy.** Proof that shows customer material stays in a private folder; only made-up data appears on the page or in a PR.

Also state, for agents: `plan.branches`, `plan.flow` (the ticket loop and the PR loop), `plan.pr_template`, `plan.review_policy`, `plan.merge_checklist`, `plan.github` (repository settings to change first), `plan.stop_rules`, `plan.heartbeat_minutes`. Milestones are optional and agent mode only.

## Estimates are agent time

Never human days. Say three things in plain words: build time (the longest parallel lane sets the clock), the merge line (one approval and one CI run per PR), and review time. A ticket note reads like "2 h build, 30 min review".

## The verification plan

Agree how the work will be proven before anything is built, and keep it small. `plan.verification`:

1. **`ready`**: what the checks need before the run, each with how the lead proves it and `who` supplies it (`agent` or a person): the local stack, accounts and keys, signed-in tools, test data, baselines, spend. Probe while planning and set `state` (`ok`, `missing`, `unknown`). Ask once in chat for anything only a person can supply; do not call the plan safe to start while one is missing.
2. **`building`**: the checks agents run on their own (the ticket loop, the PR loop, CI). The floor, not the proof.
3. **`checks`**: the final pass, once, on a fresh copy holding every PR. Every ticket appears in at least one check; aim for about one check per two tickets. Each says how it should work (`expect`) and what counts as passing (`pass`). `kind` is the cheapest that truly proves it: `code` (a test, a search, a read-only command), `screen` (open one screen and look), `watch` (seen during a real run), `ask` (a person types `say` mid-run), `measure` (compared with the baseline).
4. **`runs`**: the one to three real runs the live checks share, each with what it does, cost and time; `needs` names an earlier run that must hold first.

Cover each high-risk ticket's failure path, not only its happy path. Say the total cost and time in `summary`.

**Done means proven.** A ticket is `built` once its own proof and review pass, `done` only when its final check passes. A failing check gets one fix round, then the report says so plainly.

## Simplicity rules builders carry

- The fewest lines that meet the done-when. Reuse what exists; prefer the official primitive or library.
- Delete what the change makes dead. Net negative lines is a good sign.
- Tests prove behaviour a person cares about. No tests that restate the code.
- No new dependency without a reason in the ticket notes.

## The checker

`node scripts/build.mjs <book-dir>` refuses: an unknown step, PR or dependency; a ticket in no PR or two; a PR depending on or stacked on a PR in the same or a later step; a stack that loops; a ticket depending on a later commit in its own PR or on a PR in the same or a later step; an id that collides with a status document; a final check with an unknown ticket or run, or an ask check without `say`; a ticket no check covers once checks exist; a dash; a missing file; and the section errors in `components.md`. It warns on S tickets, a stack that branches, two PRs in one step owning the same area, more than six PRs in a step, too many checks, and the writing rules it can count in `design.md` (budgets, ids, codes, file names, assumed context, certainty marks, instruction leads). It cannot judge plain language; read the page as a stranger. Fix every error and warning before publishing.
