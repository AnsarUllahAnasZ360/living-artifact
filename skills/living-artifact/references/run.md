# Running the build from the book

The run is a fresh chat opened in the repo, started by the kickoff. Work lands as small reviewed pull requests, merged one at a time. The lead orchestrates; builders, reviewers and checkers are agents. The lead never builds a ticket itself unless the book says "lead" as its agent.

## Orient (no other docs)

1. `Artifact read` the book URL. Restore the working copy if this machine lacks it: `Artifact read` with `paths` for every `book.files` entry into `<repo>/docs/<book-id>/book/`.
2. Read `agent/CHECKPOINT.md` (where the last session stopped), `agent/ASK.md`, and the research files the tickets cite.
3. ArtifactData `list` on `decisions`, `feedback`, `gates`, `status`, `run`. A decision with no document is not opened: use the recommendation unless it `blocks` a ticket in the next wave, then ask once in chat.
4. Read the repo's CLAUDE.md. Check the dev stack the book names is up (start it if not).
5. Write `run/current` (`phase: merging` or the real phase) and a `log` row of kind `start`.

## Branches and pull requests

Work lands as small pull requests into the development branch the book names (`plan.branches.development`), never as one long branch. Each ticket ships as one PR, or a short stack of two to four when one goal is too big to review at once (`plan.prs`). A PR is about 200 to 400 changed lines; past 400, split it or say why in its body. Production moves only by the release path the book states.

- **Independent PR**: its base is the development branch. It merges in any order once proven.
- **Stacked PR**: its base is the PR below it. The stack merges bottom first. After a squash merge, the next PR is rebased onto the development branch with `git rebase --onto`, pushed with `--force-with-lease` to its own branch, and retargeted with `gh pr edit --base`. GitHub's own stacks (`gh stack`) do the same when the installed gh supports them.
- **Every PR body** holds the ticket's goal, each done-when with its verdict and evidence, how to test it, its risk, the review it needs, and a link to the book. Proof images live in the book's `agent/proof/`; the body links them.
- **Before the first wave**, apply the repository settings in `plan.github` (for example, delete head branches on merge, required checks), and say on the page which are done.

## Review before merge, by risk

Every PR is reviewed before it merges, by fresh agents that have not seen the work. Depth follows the ticket's risk (`plan.review_policy` can tighten it):

| Risk | Review | Merges when |
|---|---|---|
| low | One reviewer, correctness and simplicity together | Checks green, proof in the body, no open important finding |
| medium | Two reviewers (correctness, simplicity), then a refuter that drops what it cannot confirm | The same |
| high | As medium, plus a named person approves on GitHub | The same, and a human approval is on the PR |

Important findings go back to a fixer on that PR's branch, and the new diff alone is reviewed again. `nit` findings are fixed only when trivial. `pre-existing` findings go to `report.found`. After three rounds on one PR, stop and ask whether the approach is wrong.

## One wave

Run each wave with the Workflow tool (the kickoff is the user's opt-in; at most six builders, with reviewers, refuters and fixers per PR, one merger and one spot checker). Builds run as a pipeline: each ticket's review starts as soon as its PRs open, not when the whole wave is built. Merges are one at a time, so the development branch is always green. Pass the wave as `args`:

```json
{ "wave": "Search everywhere", "repo": "/abs/repo", "dev": "develop", "book": "https://claude.ai/artifact/...",
  "app": "http://localhost:4000/<made-up project path>", "proofDir": "/abs/repo/docs/<book-id>/book/agent/proof", "rules": "the binding rules, short",
  "tickets": [ { "id": "...", "title": "...", "risk": "medium", "owns": ["path"], "goal": "...", "done": ["..."], "verify": { "run": "...", "code": "...", "browser": "..." },
    "prs": [ { "id": "search-index", "title": "...", "base": "develop", "branch": "search/search-api-index" } ] } ] }
```

```js
export const meta = {
  name: 'book-wave',
  description: 'Build one wave in parallel as small PRs, review each PR by risk and fix it, merge one at a time when proven, spot check the result',
  phases: [{ title: 'Build' }, { title: 'Review' }, { title: 'Fix' }, { title: 'Merge' }, { title: 'Spot check' }],
}
const W = args
const PROOF = { type: 'array', items: { type: 'object', properties: { done: { type: 'string' }, evidence: { type: 'string' }, verdict: { enum: ['verified', 'not verified', 'inconclusive'] } }, required: ['done', 'evidence', 'verdict'] } }
const BUILT = { type: 'object', properties: { ticket: { type: 'string' },
  prs: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, number: { type: 'number' }, branch: { type: 'string' }, base: { type: 'string' }, lines: { type: 'number' } }, required: ['id', 'number', 'branch', 'base'] } },
  proof: PROOF, notDone: { type: 'array', items: { type: 'string' } } }, required: ['ticket', 'prs', 'proof', 'notDone'] }
const FINDINGS = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: {
  pr: { type: 'number' }, file: { type: 'string' }, line: { type: 'number' }, severity: { enum: ['important', 'nit', 'pre-existing'] },
  problem: { type: 'string' }, howToShow: { type: 'string' }, fix: { type: 'string' } }, required: ['file', 'severity', 'problem', 'fix'] } } }, required: ['findings'] }
const FIXED = { type: 'object', properties: { pushed: { type: 'boolean' }, note: { type: 'string' } }, required: ['pushed', 'note'] }
const MERGED = { type: 'object', properties: {
  merged: { type: 'array', items: { type: 'object', properties: { pr: { type: 'number' }, sha: { type: 'string' } }, required: ['pr'] } },
  waiting: { type: 'array', items: { type: 'object', properties: { pr: { type: 'number' }, why: { type: 'string' } }, required: ['pr', 'why'] } } }, required: ['merged', 'waiting'] }
const SEEN = { type: 'object', properties: { results: { type: 'array', items: { type: 'object', properties: {
  ticket: { type: 'string' }, pass: { type: 'boolean' }, screenshot: { type: 'string' }, saw: { type: 'string' } }, required: ['ticket', 'pass', 'saw'] } } }, required: ['results'] }
const LENS = { correctness: 'bugs, broken contracts between server, screen and agent, missing or weak proof, security, rule breaks',
  simplicity: 'code that can be deleted, a shorter or more standard way, duplicated logic, tests that prove nothing' }
const byId = Object.fromEntries(W.tickets.map((t) => [t.id, t]))

const review = async (t, prs, label) => {
  const lenses = t.risk === 'low' ? ['correctness and simplicity'] : ['correctness', 'simplicity']
  const raw = (await parallel(lenses.map((lens) => () => agent(
    `You have not seen this work. In ${W.repo}, read-only, review ${prs.map((p) => `PR #${p.number} (gh pr diff ${p.number})`).join(' and ')} ` +
    `against this ticket: ${JSON.stringify({ goal: t.goal, done: t.done })}. Also read each PR body and check its proof is real evidence for every done-when. ` +
    `Lens: ${lens}: ${lens.split(' and ').map((l) => LENS[l]).join('; ')}. Report only problems you can point to a file and line for, with how to show it fails. ` +
    `Tag each important, nit or pre-existing (already broken before this PR). Ignore style.`,
    { label: `${label}:${t.id}:${lens.split(' ')[0]}`, phase: 'Review', schema: FINDINGS })))).filter(Boolean).flatMap((r) => r.findings)
  if (!raw.length || t.risk === 'low') return raw
  return (await agent(`Try to refute each finding by reading the code in ${W.repo}. Keep only real ones and name each kept finding's bug class.\n${JSON.stringify(raw, null, 2)}`,
    { label: `refute:${t.id}`, phase: 'Review', schema: FINDINGS }))?.findings || []
}

const results = await pipeline(W.tickets,
  (t) => agent(
    `You own one goal in wave "${W.wave}". Work in your own git worktree. You own only: ${t.owns.join(', ')}; if the goal needs more, stop and say so in notDone. ` +
    `Read the code and find the way yourself. Use the official primitive or library over new code, reuse what exists, delete what your change makes dead, ` +
    `and write only tests that prove behaviour a person cares about. Ship it as these PRs, in order: ${JSON.stringify(t.prs)}. ` +
    `For each, create its branch from its base, commit, push, and open it with gh pr create --base <base> --head <branch>. A stacked PR's base is the branch below it. ` +
    `Keep each PR near 200 to 400 changed lines; past 400, split it or say why in the body. ` +
    `Before you open the last PR, prove every done-when: run the area's tests, and walk each one in a browser on your own copy of the app on a free port, ` +
    `saving ${W.proofDir}/${t.id}-<n>.png. Stop every server you started. Each PR body holds the goal, every done-when with its verdict and evidence, ` +
    `how to test, the risk, and the book link ${W.book}. Never claim what you did not run. Rules: ${W.rules}\n\n${JSON.stringify(t, null, 2)}`,
    { label: `build:${t.id}`, phase: 'Build', isolation: 'worktree', schema: BUILT }),
  async (b) => {
    if (!b || !b.prs.length) return null
    const t = byId[b.ticket]
    let findings = await review(t, b.prs, 'review')
    let important = findings.filter((f) => f.severity === 'important')
    if (important.length) {
      await agent(`In ${W.repo}, check out the branch of each PR named in these findings (gh pr checkout <n>), fix every instance of each finding's bug class ` +
        `with the smallest change, commit "Review fixes", and push to that PR's own branch. Update the PR body's proof if it changed. Rules: ${W.rules}\n${JSON.stringify(important, null, 2)}`,
        { label: `fix:${t.id}`, phase: 'Fix', isolation: 'worktree', schema: FIXED })
      findings = await review(t, b.prs, 'recheck')
      important = findings.filter((f) => f.severity === 'important')
    }
    return { ticket: t.id, risk: t.risk, prs: b.prs, proof: b.proof, notDone: b.notDone, findings, clean: !important.length && !b.notDone.length }
  })
const done = results.filter(Boolean)

phase('Merge')
const ready = done.filter((r) => r.clean)
const landed = ready.length ? await agent(
  `In ${W.repo}, merge these PRs into ${W.dev} one at a time, in this order: ${JSON.stringify(ready.map((r) => ({ ticket: r.ticket, risk: r.risk, prs: r.prs.map((p) => ({ number: p.number, base: p.base, branch: p.branch })) })))}. ` +
  `For each PR: wait for its required checks on the latest commit (gh pr checks <n> --watch); if one fails, rerun it once (gh run rerun --failed) and leave the PR waiting if it fails again. ` +
  `A high-risk PR merges only when gh pr view <n> --json reviews shows an APPROVED review from a person; otherwise leave it waiting. ` +
  `Merge with gh pr merge <n> --squash --delete-branch. In a stack, merge bottom first; then rebase the next PR with git rebase --onto origin/${W.dev} <old base head> <its branch>, ` +
  `push with --force-with-lease to that PR's own branch only, retarget it with gh pr edit <n> --base ${W.dev}, and wait for its checks again. ` +
  `Never push to ${W.dev} directly, never force-push it, never merge a red PR. Return each merged PR with its merge commit, and each waiting PR with why.`,
  { label: 'merge', phase: 'Merge', schema: MERGED }) : { merged: [], waiting: [] }

phase('Spot check')
const mergedTickets = ready.filter((r) => r.prs.every((p) => landed.merged.some((m) => m.pr === p.number))).map((r) => byId[r.ticket])
const seen = mergedTickets.length ? (await agent(
  `${W.dev} now holds these tickets. Pull it in a fresh worktree of ${W.repo}, start the app on a free port with made-up data only, and with Playwright headless ` +
  `look at each builder's screenshots in ${W.proofDir}, then walk ONE done-when yourself per ticket, save ${W.proofDir}/<ticket id>-merged.png, and say exactly what is on screen. ` +
  `pass only if the screenshots show every done-when and your walk agrees. Stop the server.\n` + JSON.stringify(mergedTickets.map((t) => ({ id: t.id, browser: t.verify.browser, done: t.done }))),
  { label: 'spot-check', phase: 'Spot check', isolation: 'worktree', schema: SEEN }))?.results || [] : []

return { wave: W.wave, tickets: done, merged: landed.merged, waiting: landed.waiting, seen, failed: seen.filter((s) => !s.pass).map((s) => s.ticket) }
```

High-risk PRs wait in `waiting` until the named person approves. The lead asks for that approval in Needs you with the PR link, and merges it in the next wave's merge step or by hand with the same checks.

## After each wave (the lead)

1. Read each PR's checks and its review findings yourself. Green counts only if you see it.
2. Open three screenshots at random and every failed ticket's. A screenshot that does not show the claim means not done.
3. A failed ticket goes back to one builder with the failure text. The review loop caps at three rounds; after that, ask whether the approach is wrong. Later rounds review only the new diff.
4. `nit` findings are fixed only if trivial; `pre-existing` go to `report.found`, never into the ticket's loop.
5. Write with one ArtifactData `batch`: every ticket's `status/<id>` (state, note, proof paths, sha), `run/current`, and `log` rows for merge, gate, review, fix and proof. Answer any feedback the wave addressed (`resolved`, `answer`).
6. Append to `agent/CHECKPOINT.md`: what landed, rulings, next step. Copy proof images into the book's `agent/proof/`, rebuild, republish.
7. Pull the development branch. Nothing reaches it except through merged PRs.
8. Read `feedback` and `decisions` again before the next wave.

## Stop rules (ask the user only when)

- A decision that blocks the next wave is unopened.
- The gate stays red after two fix rounds.
- Real data shows the plan is wrong.
- An action needs a yes the book does not already give (deleting data, a cloud migration, anything outward-facing).

Otherwise keep going and record each ruling in the log.

## Memory across sessions

Before the context fills, and at the end of every wave, the book must be enough to resume: status and log in the db, CHECKPOINT current, content republished. A resumed session runs Orient again and continues from `run/current`.
