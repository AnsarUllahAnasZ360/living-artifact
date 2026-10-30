# Running the build from the book

The run is a fresh chat opened in the repo, started by the kickoff. The lead orchestrates; builders, reviewers and checkers are agents. The lead never builds a ticket itself unless the book says "lead" as its agent.

## Orient (no other docs)

1. `Artifact read` the book URL. Restore the working copy if this machine lacks it: `Artifact read` with `paths` for every `book.files` entry into `<repo>/docs/<book-id>/book/`.
2. Read `agent/CHECKPOINT.md` (where the last session stopped), `agent/ASK.md`, and the research files the tickets cite.
3. ArtifactData `list` on `decisions`, `feedback`, `gates`, `status`, `run`. A decision with no document is not opened: use the recommendation unless it `blocks` a ticket in the next wave, then ask once in chat.
4. Read the repo's CLAUDE.md. Check the dev stack the book names is up (start it if not).
5. Write `run/current` (`phase: merging` or the real phase) and a `log` row of kind `start`.

## Open the draft PR first

Create or reuse the branch the book names, push it, open a draft PR into the book's base with `gh pr create --draft`, a one-paragraph body that links the book, and the user's attribution rules. Put the PR link in `book.links` and republish. Every ticket lands as one commit on this branch, titled with the ticket title. Push after every wave.

## One wave

Run each wave with the Workflow tool (the kickoff is the user's opt-in; at most six builders plus one merger, two reviewers, one refuter, one fixer and one spot checker). Pass the wave as `args`:

```json
{ "wave": "Search everywhere", "branch": "search-everywhere", "repo": "/abs/repo", "gate": "the gate command",
  "app": "http://localhost:4000/<made-up project path>", "proofDir": "docs/<book-id>/book/agent/proof", "rules": "the binding rules, short",
  "tickets": [ { "id": "...", "title": "...", "risk": "medium", "owns": ["path"], "goal": "...", "done": ["..."], "verify": { "code": "...", "browser": "..." } } ] }
```

```js
export const meta = {
  name: 'book-wave',
  description: 'Build one wave of goal tickets in parallel, squash each into one commit, gate, review by risk, fix, spot check',
  phases: [{ title: 'Build' }, { title: 'Merge and gate' }, { title: 'Review' }, { title: 'Fix' }, { title: 'Spot check' }],
}
const W = args
const BUILT = { type: 'object', properties: { ticket: { type: 'string' }, branch: { type: 'string' },
  proof: { type: 'array', items: { type: 'object', properties: { done: { type: 'string' }, evidence: { type: 'string' }, verdict: { enum: ['verified', 'not verified', 'inconclusive'] } }, required: ['done', 'evidence', 'verdict'] } },
  linesAdded: { type: 'number' }, linesDeleted: { type: 'number' }, notDone: { type: 'array', items: { type: 'string' } } },
  required: ['ticket', 'branch', 'proof', 'notDone'] }
const FINDINGS = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: {
  file: { type: 'string' }, line: { type: 'number' }, severity: { enum: ['important', 'nit', 'pre-existing'] },
  problem: { type: 'string' }, howToShow: { type: 'string' }, fix: { type: 'string' } }, required: ['file', 'severity', 'problem', 'fix'] } } }, required: ['findings'] }
const GATE = { type: 'object', properties: { green: { type: 'boolean' }, commits: { type: 'array', items: { type: 'string' } }, log: { type: 'string' } }, required: ['green', 'log'] }
const SEEN = { type: 'object', properties: { results: { type: 'array', items: { type: 'object', properties: {
  ticket: { type: 'string' }, pass: { type: 'boolean' }, screenshot: { type: 'string' }, saw: { type: 'string' } }, required: ['ticket', 'pass', 'saw'] } } }, required: ['results'] }

phase('Build')
const built = (await parallel(W.tickets.map((t) => () => agent(
  `You own one goal in wave "${W.wave}". Work in your own git worktree and branch; commit as often as you like. ` +
  `You own only: ${t.owns.join(', ')}. If the goal needs more, stop and say so in notDone. ` +
  `Read the code and find the way yourself; do not wait for steps. Use the official primitive or library over new code, reuse what exists, ` +
  `delete what your change makes dead, write only tests that prove behaviour a person cares about. ` +
  `Before you report, prove every done-when: run the area's tests, and walk each one in a browser on your own copy of the app on a free port, ` +
  `saving ${W.proofDir}/${t.id}-<n>.png. Stop every server you started before you report. Give each done-when a verdict with its evidence; never claim what you did not run. Rules: ${W.rules}\n\n` +
  JSON.stringify(t, null, 2),
  { label: `build:${t.id}`, phase: 'Build', isolation: 'worktree', schema: BUILT })))).filter(Boolean)

phase('Merge and gate')
const gate1 = await agent(
  `In ${W.repo} on ${W.branch}, land each builder branch as ONE commit titled with its ticket title: "git merge --squash <branch>" then "git commit". ` +
  `Order: ${built.map((b) => `${b.branch} (${W.tickets.find((t) => t.id === b.ticket)?.title})`).join('; ')}. ` +
  `Never rebase, reset, stash or force. Resolve conflicts by reading both sides and keeping both intents. Then run the gate: ${W.gate}. ` +
  `green is true only if every step passed. Return the commit hashes and the log tail.`,
  { label: 'merge-and-gate', phase: 'Merge and gate', schema: GATE })

phase('Review')
const risky = W.tickets.filter((t) => t.risk !== 'low')
const lenses = [['correctness', 'bugs, broken contracts between server, screen and agent, missing proof, security, rule breaks'],
  ['simplicity', 'code that can be deleted, a shorter or more standard way, duplicated logic, tests that prove nothing']]
const raw = risky.length ? (await parallel(lenses.map(([lens, what]) => () => agent(
  `You have not seen this work. Review the diff of wave "${W.wave}" in ${W.repo} (git diff ${W.branch} against the commit before this wave; read-only) ` +
  `against these tickets' goals and done-whens: ${JSON.stringify(risky.map((t) => ({ id: t.id, goal: t.goal, done: t.done })))}. ` +
  `Lens: ${lens}: ${what}. Report only merge-blocking problems you can point to a file and line for, with how to show it fails. ` +
  `Tag each important, nit or pre-existing (already broken before this wave). Ignore style.`,
  { label: `review:${lens}`, phase: 'Review', schema: FINDINGS })))).filter(Boolean).flatMap((r) => r.findings) : []
const confirmed = raw.length ? (await agent(
  `Try to refute each finding by reading the code in ${W.repo}. Keep only real ones; drop what you cannot confirm. Name the bug class of each kept finding.\n` +
  JSON.stringify(raw, null, 2), { label: 'refute', phase: 'Review', schema: FINDINGS })).findings : []
const toFix = confirmed.filter((f) => f.severity === 'important')

phase('Fix')
const gate2 = toFix.length ? await agent(
  `In ${W.repo} on ${W.branch}, fix every instance of each finding's bug class with the smallest change, one commit "Review fixes: ${W.wave}". ` +
  `Then run the gate: ${W.gate}. Rules: ${W.rules}\n${JSON.stringify(toFix, null, 2)}`,
  { label: 'fix', phase: 'Fix', schema: GATE }) : gate1

phase('Spot check')
const seen = (await agent(
  `The wave is merged in ${W.repo}. With Playwright headless on ${W.app} (made-up data only): for each ticket, look at the builder's screenshots in ${W.proofDir}, ` +
  `then walk ONE done-when yourself on the merged app, save ${W.proofDir}/<ticket id>-merged.png, and say exactly what is on screen. ` +
  `pass only if the screenshots show every done-when and your walk agrees.\n` + JSON.stringify(W.tickets.map((t) => ({ id: t.id, browser: t.verify.browser, done: t.done }))),
  { label: 'spot-check', phase: 'Spot check', schema: SEEN }))?.results || []

return { wave: W.wave, built, gate: gate2, findings: confirmed, fixed: toFix.length, seen, failed: seen.filter((s) => !s.pass).map((s) => s.ticket) }
```

High-risk tickets also get a named human check in the report ("Sam: look at the migration on the staging database").

## After each wave (the lead)

1. Read the gate log yourself. Green counts only if you see it.
2. Open three screenshots at random and every failed ticket's. A screenshot that does not show the claim means not done.
3. A failed ticket goes back to one builder with the failure text. The review loop caps at three rounds; after that, ask whether the approach is wrong. Later rounds review only the new diff.
4. `nit` findings are fixed only if trivial; `pre-existing` go to `report.found`, never into the ticket's loop.
5. Write with one ArtifactData `batch`: every ticket's `status/<id>` (state, note, proof paths, sha), `run/current`, and `log` rows for merge, gate, review, fix and proof. Answer any feedback the wave addressed (`resolved`, `answer`).
6. Append to `agent/CHECKPOINT.md`: what landed, rulings, next step. Copy proof images into the book's `agent/proof/`, rebuild, republish.
7. Push the branch.
8. Read `feedback` and `decisions` again before the next wave.

## Stop rules (ask the user only when)

- A decision that blocks the next wave is unopened.
- The gate stays red after two fix rounds.
- Real data shows the plan is wrong.
- An action needs a yes the book does not already give (deleting data, a cloud migration, anything outward-facing).

Otherwise keep going and record each ruling in the log.

## Memory across sessions

Before the context fills, and at the end of every wave, the book must be enough to resume: status and log in the db, CHECKPOINT current, content republished. A resumed session runs Orient again and continues from `run/current`.
