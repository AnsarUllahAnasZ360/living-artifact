# Running the build from the book

The run is a fresh chat opened in the repo, started by the kickoff. Work lands as one pull request per problem category, each ticket one commit inside it. Review and proof happen before a PR exists: every ticket is built, tested, proven and reviewed before its commit is final, and every PR is reviewed whole and run end to end before it opens. PRs stack in one line and stay open: the run never waits for a merge. It ends with the agreed checklist run once on a fresh copy of the product built from the top of the stack, then the report. The lead orchestrates; builders, reviewers, provers and fixers are agents.

## Orient (no other docs)

1. `Artifact read` the book URL. Restore the working copy if this machine lacks it: `Artifact read` with `paths` for every `book.files` entry into `<repo>/docs/<book-id>/book/`.
2. Read `agent/CHECKPOINT.md` (where the last session stopped), `agent/ASK.md`, and the research files the tickets cite.
3. ArtifactData `list` on `decisions`, `feedback`, `gates`, `status`, `run`. A decision with no document is not opened. Use its recommendation only when it blocks nothing in the next wave and its recommended option changes nothing outside the branches (repository settings, a release, money spent, data outside the local stack); otherwise ask once in chat and wait.
4. Read the repo's CLAUDE.md. Find the one local stack the book names and who owns its processes; start it if it is down, and never start a second copy on other ports.
5. Before wave 1, and after any long pause, probe every `plan.verification.ready` item and write `status/ready-<id>` (`{ state: ok | missing, note, at }`). Supply what the agent can. An item only a person can supply or confirm (an approval inside an app, a setting only they can change) is asked once in chat before the run starts, never found missing overnight; a missing one goes to Needs you and stops the run.
6. Write `run/current` (the real phase) and a `log` row of kind `start`.

## Branches and pull requests

- **One PR per category** (`plan.prs`), branch named in the plan, all in **one stack**. The first PR to open goes into the development branch (`plan.branches.development`); each later one is rebased onto the branch of the PR opened just before it and opens into that branch, saying so in its body. The top of the stack (the `tip`) therefore holds every PR. A wave's PRs are built from the tip when the wave starts and join the stack in the order they finish; the plan's `base` is only the expected order. Nothing waits for a merge: the person merges bottom first, each with a merge commit, and the merged branch is deleted (by the repository setting that deletes head branches on merge, or by the person's Delete branch), which makes the code host retarget the next PR to the development branch. A merged branch that is not deleted leaves the next PR pointing at it, so `plan.github` or `merge_checklist` says who deletes it. When the tip's own branch is gone because it merged, the tip is the development branch again. Make sure CI runs on PRs into the branches you stack on, and protect the development branch from deletion.
- **One commit per ticket**, in the PR's ticket order, subject in the repo's commit convention naming the round and ticket. The builder makes a candidate commit so the one stack can run exactly that code and a reviewer can read exactly what lands; it is final only after its proof and review pass, and nothing is pushed until the PR loop passes. Every fix is a fixup of its ticket's commit (`git commit --fixup=<ticket sha>`), never an amend, then `git rebase --autosquash <the PR's base>` (Git 2.44 or newer; older needs `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash`).
- **A fix to a PR lower in the stack** is made in that PR's own worktree (add it again with `git worktree add` if it was removed). Note its head first, fold the fix in as above, and push it with `--force-with-lease`. Then, bottom up, move each open PR above it from its own worktree with `git rebase --onto origin/<the PR below> <that PR's old head>` and push it the same way; its own old head is the one the next PR up needs. Never rebase from the development branch. Never rewrite a merged PR: a fix to one goes as a new commit named for its ticket on the PR at the tip. A PR made of a merge commit gets its fix as a new commit on its own branch, and the PRs above move as before.
- **Merge** with a merge commit, never a squash or a rebase merge: only a merge commit keeps the reviewed commit ids, so one ticket can be reverted alone (`git revert <sha>`) and the whole PR with `git revert -m 1 <merge>`.
- **Hotfix**: when a PR names `hotfix`, the lead, right after that PR opens, cherry-picks the named tickets' final commits onto a new branch from the hotfix base, runs their tests there, and opens that PR outside the stack. The person releases it.
- **Drop, do not hold**: a ticket that cannot prove its done-when or clear its review after two fix rounds is reset away while it is still the latest commit (the next ticket starts only after this one is final, so nothing is rebased), its status set to `blocked` with the reason, and every ticket that depends on it, in this PR or a later wave, is dropped with it. The PR goes on without it. Provers check `done_when` only: what only a merge or a deploy can show is in the ticket's `after_merge` and goes to the report, so it never drops a ticket. A graded run that scores worse than the book's baseline is not a drop: stop and ask, since no single ticket is shown to cause it.
- **Before the first wave**, apply the repository settings in `plan.github` that the person agreed, and say on the page which are done.

## The ticket loop (inside a PR's branch)

1. The builder reads the code and makes the change in the PR's worktree, deleting what the change makes dead.
2. It runs the area's tests, the type check and the linter, and adds or extends only tests that prove the done-when. A skipped test counts as not run.
3. It makes the candidate commit locally.
4. At the same time: the ticket's done-when is proven on the one local stack (the candidate commit checked out there, the PR's own fresh test Project, a browser walk for screens, the replay or real run the ticket names for agent behaviour), and a fresh reviewer reads the commit alone for correctness, and simplicity and bloat. For medium and high risk, two reviewers and a refuter that keeps only what it can show in the code.
5. Findings and failed checks go back to a fixer, folded into the same commit; the changed diff is reviewed again and the ticket proven again. Two rounds at most, then the commit is reset away and the ticket dropped.
6. Only then is the commit final and the next ticket starts.

**Evidence stays private when it shows real data.** Screenshots of made-up test data go to the book's `agent/proof/` and the PR. Anything that shows customer material (a real bid's drawings, names or prices) is saved only in the private folder the book names; the book and the PR get the verdict in words.

## The PR loop (before it opens)

1. **Review the whole PR**: correctness across tickets, simplicity and bloat (every line serves a done-when), and security, then a refuter. Fixes are folded into the ticket commit they belong to, and any ticket whose behaviour changed is proven again.
2. **Run it end to end**: the PR's `proof` list on the local stack, on the PR's test Project with a fresh Chat.
3. **Open it**: push the branch and open the PR with the book's `pr_template`: the problems, one row per commit (ticket, what it fixes, files, lines added and deleted), the line accounting split into production, tests, and docs and config, the proof per ticket with screenshots and test names, what is not proven, and how to check it.
4. **Checks**: watch the required checks. A failure that is flaky is rerun once; a real failure goes to a fixer, folded into its ticket commit, and pushed with `--force-with-lease` to the PR's own branch.
5. **It stays open.** The PR joins the stack and the run moves on. The person the book names merges the stack bottom first, during the run or after the report; nothing waits for it.

Only one thing proves at a time on the local stack and its browser. Builders of other PRs keep coding and testing in their worktrees while one ticket proves.

## One wave

Run each wave with the Workflow tool (the kickoff is the user's opt-in). PR lanes run in parallel as a pipeline; proof takes turns on the one stack through a queue. Pass the wave as `args`:

```json
{ "wave": "Shut the door", "round": "harness-fix", "repo": "/abs/repo", "ghRepo": "owner/name", "worktrees": "/abs/worktrees", "dev": "feat/x", "tip": "fix/screens", "book": "https://claude.ai/artifact/...",
  "app": "http://localhost:4000", "proofDir": "/abs/repo/docs/<book-id>/book/agent/proof", "privateDir": "/abs/private/proof", "template": "the PR body headings", "rules": "the binding rules, short",
  "dropped": ["ticket ids dropped in earlier waves"],
  "prs": [ { "id": "security", "title": "...", "branch": "fix/security", "risk": "high", "proof": ["..."],
    "tickets": [ { "id": "...", "title": "...", "risk": "high", "files": ["path"], "depends_on": [], "goal": "...", "done": ["..."], "verify": { "code": "...", "browser": "...", "run": "..." } } ] } ] }
```

`tip` is the top of the stack when the wave starts: the branch of the last PR opened, or the development branch before the first or once the tip itself has merged. Every PR of the wave is built from `origin/<tip>`; each opens on whatever is on top when it finishes, and the script returns the new `tip` for the next wave. A ticket's `done` is its `done_when`; its `after_merge` items are not passed.

```js
export const meta = {
  name: 'book-wave',
  description: 'Build one wave of category PRs: each ticket built, proven on the one local stack and reviewed before its commit is final; each PR reviewed whole, run end to end, then opened on top of the stack',
  phases: [{ title: 'Build' }, { title: 'Review' }, { title: 'Open' }],
}
const W = args
const COMMIT = { type: 'object', properties: { sha: { type: 'string' }, files: { type: 'array', items: { type: 'string' } }, tests: { type: 'string' }, blocked: { type: 'string' } }, required: ['sha', 'files', 'tests'] }
const FINDINGS = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: {
  ticket: { type: 'string' }, file: { type: 'string' }, line: { type: 'number' }, severity: { enum: ['important', 'nit', 'pre-existing'] },
  problem: { type: 'string' }, howToShow: { type: 'string' }, fix: { type: 'string' } }, required: ['file', 'severity', 'problem', 'fix'] } } }, required: ['findings'] }
const PROVEN = { type: 'object', properties: { results: { type: 'array', items: { type: 'object', properties: {
  ticket: { type: 'string' }, done: { type: 'string' }, evidence: { type: 'string' }, verdict: { enum: ['verified', 'not verified', 'inconclusive'] } },
  required: ['ticket', 'done', 'evidence', 'verdict'] } } }, required: ['results'] }
const DONE = { type: 'object', properties: { ok: { type: 'boolean' }, note: { type: 'string' } }, required: ['ok', 'note'] }
const OPENED = { type: 'object', properties: { number: { type: 'number' }, url: { type: 'string' }, base: { type: 'string' }, checks: { enum: ['green', 'red', 'pending'] }, note: { type: 'string' } }, required: ['checks'] }
const LENS = { correctness: 'bugs, broken contracts between server, screen and agent, missing or weak proof, rule breaks',
  simplicity: 'code that can be deleted, a shorter or more standard way, duplicated logic, tests that prove nothing, lines that serve no done-when',
  security: 'auth, tenant isolation, secrets, data leaving the system, injection' }

let queue = Promise.resolve()
const onStack = (fn) => { const run = queue.then(fn); queue = run.catch(() => null); return run }
const from = `origin/${W.tip}`
let tip = W.tip, opening = Promise.resolve()
const onTip = (fn) => { const run = opening.then(fn); opening = run.catch(() => null); return run }

const review = async (what, lenses, risk, label, phase) => {
  const raw = (await parallel(lenses.map((lens) => () => agent(
    `You have not seen this work. Read-only. Review ${what}. Lens: ${lens}: ${LENS[lens]}. Report only problems you can point to a file and line for, ` +
    `with how to show it fails. Tag each important, nit or pre-existing. Ignore style.`,
    { label: `${label}:${lens}`, phase, schema: FINDINGS })))).filter(Boolean).flatMap((r) => r.findings)
  if (!raw.length || risk === 'low') return raw.filter((f) => f.severity === 'important')
  const kept = await agent(`Try to refute each finding by reading the code. Keep only real ones.\n${JSON.stringify(raw, null, 2)}`, { label: `${label}:refute`, phase, schema: FINDINGS })
  return (kept?.findings || []).filter((f) => f.severity === 'important')
}

const fix = (wt, baseRef, findings, label, phase) => agent(
  `In the worktree ${wt}, fix every instance of each finding's bug class with the smallest change. Fold each fix into the commit of the ticket it belongs to ` +
  `(git commit --fixup=<that ticket's sha>, then git rebase --autosquash ${baseRef}). Run the area tests again. Do not push. Rules: ${W.rules}\n${JSON.stringify(findings, null, 2)}`,
  { label, phase, schema: DONE })

const proveTicket = (wt, pr, t, label, phase) => onStack(() => agent(
  `You run the one local stack in ${W.repo} and the in-app browser pane (never the person's own browser). Check out the commit under test: ` +
  `git -C ${W.repo} switch --detach $(git -C ${wt} rev-parse HEAD). Restart only what it changed. Use this PR's test Project "${pr.id}" ` +
  `(make it fresh through the product at ${W.app} the first time, clearing older test Projects the way the product allows). Check every done-when of ticket ${t.id}: walk it in the browser, ` +
  `or run the replay or real run its verify names. Save screenshots of made-up data as ${W.proofDir}/${t.id}-<n>.png; anything showing a real bid goes only to ${W.privateDir}. ` +
  `Say exactly what you saw. Then switch ${W.repo} back to ${W.dev}. Rules: ${W.rules}\n${JSON.stringify({ id: t.id, done: t.done, verify: t.verify }, null, 2)}`,
  { label, phase, schema: PROVEN })).then((r) => r?.results || [{ ticket: t.id, done: 'all', evidence: 'the prover stopped', verdict: 'inconclusive' }])

const asFindings = (t, res) => res.filter((r) => r.verdict !== 'verified').map((r) => ({ ticket: t.id, file: '', severity: 'important', problem: `not proven: ${r.done}`, fix: r.evidence }))

const build = async (pr) => {
  const wt = `${W.worktrees}/${pr.id}`
  await agent(`In ${W.repo}: git fetch --prune, then git worktree add ${wt} -b ${pr.branch} ${from} (origin/${W.dev} if ${from} is gone because it merged), then install dependencies in ${wt} the way the repo's README says. Do not push.`,
    { label: `setup:${pr.id}`, phase: 'Build', schema: DONE })
  const kept = [], dropped = [], proof = []
  const gone = (id) => (W.dropped || []).includes(id) || dropped.some((x) => x.id === id)
  for (const t of pr.tickets) {
    const lost = (t.depends_on || []).find(gone)
    if (lost) { dropped.push({ id: t.id, why: `needs ${lost}, which was dropped` }); continue }
    const c = await agent(
      `You own one ticket in PR "${pr.title}", in the worktree ${wt} (branch ${pr.branch}). Read the code and find the way yourself. Use the official primitive ` +
      `or library over new code, reuse what exists, delete what your change makes dead, and write only tests that prove the done-when. Run the area's tests, the ` +
      `type check and the linter; a skipped test counts as not run. Then make one candidate commit with the subject "[${W.round}/${t.id}] <what now works, one sentence>". ` +
      `It becomes final only after proof and review. Do not push. If the goal cannot be met, leave the tree clean and set blocked to the reason. Rules: ${W.rules}\n\n${JSON.stringify(t, null, 2)}`,
      { label: `build:${t.id}`, phase: 'Build', schema: COMMIT })
    if (!c || c.blocked) { dropped.push({ id: t.id, why: c?.blocked || 'the builder stopped' }); continue }
    const lenses = t.risk === 'low' ? ['correctness'] : ['correctness', 'simplicity']
    const brief = JSON.stringify({ goal: t.goal, done: t.done })
    let [important, res] = await Promise.all([
      review(`the candidate commit in ${wt} (git show HEAD) against this ticket: ${brief}`, lenses, t.risk, `review:${t.id}`, 'Build'),
      proveTicket(wt, pr, t, `prove:${t.id}`, 'Build')])
    for (let round = 0; (important.length || asFindings(t, res).length) && round < 2; round++) {
      await fix(wt, from, [...important, ...asFindings(t, res)], `fix:${t.id}`, 'Build')
      ;[important, res] = await Promise.all([
        review(`the candidate commit in ${wt} (git show HEAD), only what changed since the last review, against: ${brief}`, lenses, t.risk, `recheck:${t.id}`, 'Build'),
        proveTicket(wt, pr, t, `reprove:${t.id}`, 'Build')])
    }
    if (important.length || asFindings(t, res).length) {
      await agent(`In ${wt}, reset away the candidate commit of ${t.id}, which is the latest (git reset --hard HEAD~1). Do not push.`, { label: `drop:${t.id}`, phase: 'Build', schema: DONE })
      dropped.push({ id: t.id, why: [...important.map((f) => f.problem), ...asFindings(t, res).map((f) => f.problem)].join('; ') })
      continue
    }
    kept.push(t); proof.push(...res)
  }
  return { pr, wt, kept, dropped, proof }
}

const reviewWhole = async (lane) => {
  if (!lane || !lane.kept.length) return lane
  const what = `the whole branch in ${lane.wt} (git log -p ${from}..HEAD), PR "${lane.pr.title}", tickets ${JSON.stringify(lane.kept.map((t) => ({ id: t.id, goal: t.goal, done: t.done })))}`
  const important = await review(what, ['correctness', 'simplicity', 'security'], lane.pr.risk, `whole:${lane.pr.id}`, 'Review')
  if (important.length) {
    await fix(lane.wt, from, important, `fix-whole:${lane.pr.id}`, 'Review')
    for (const t of lane.kept.filter((k) => important.some((f) => f.ticket === k.id))) {
      const again = await proveTicket(lane.wt, lane.pr, t, `reprove-whole:${t.id}`, 'Review')
      lane.proof = lane.proof.filter((r) => r.ticket !== t.id).concat(again)
    }
  }
  const e2e = await onStack(() => agent(
    `On the one local stack in ${W.repo}, check out ${lane.pr.branch} detached, restart what it changed, open this PR's test Project "${lane.pr.id}" in a fresh Chat, and run this end to end: ` +
    `${JSON.stringify(lane.pr.proof)}. Save screenshots of made-up data as ${W.proofDir}/${lane.pr.id}-e2e-<n>.png, anything showing a real bid only in ${W.privateDir}. Switch back to ${W.dev}. Rules: ${W.rules}`,
    { label: `e2e:${lane.pr.id}`, phase: 'Review', schema: PROVEN }))
  return { ...lane, e2e: e2e?.results || [] }
}

const open = (lane) => (!lane || !lane.kept.length) ? lane : onTip(async () => {
  const facts = JSON.stringify({ kept: lane.kept.map((t) => t.id), dropped: lane.dropped, proof: lane.proof, e2e: lane.e2e }, null, 2)
  const opened = await agent(
    `In ${lane.wt}: git fetch --prune, then rebase ${lane.pr.branch} onto origin/${tip}, the top of the stack (origin/${W.dev} if that branch is gone because it merged; nothing to do when it is already there). If it stops on a shared file, ` +
    `keep both PRs' intent, fold the resolution into the ticket commit it belongs to, and run the area tests again. Push ${lane.pr.branch} with --force-with-lease and open the PR with ` +
    `gh pr create --repo ${W.ghRepo} --base <that branch> --head ${lane.pr.branch}. Body headings: ${W.template}. Say which PR it is stacked on and that it merges after it. ` +
    `Fill one row per commit with git show --numstat, split lines into production, tests, and docs and config, link only made-up-data screenshots, list what is not proven, ` +
    `and link the book ${W.book}. Watch the required checks (gh pr checks --repo ${W.ghRepo} --watch). Rerun a flaky failure once; fix a real one by folding it into its ticket's ` +
    `commit (git rebase --autosquash on that base) and pushing with --force-with-lease to ${lane.pr.branch} only. Never merge. Return the base you opened into.\n${facts}`,
    { label: `open:${lane.pr.id}`, phase: 'Open', schema: OPENED })
  if (opened?.number) tip = lane.pr.branch
  return { ...lane, opened }
})

const lanes = await pipeline(W.prs, build, reviewWhole, open)
return { tip, prs: lanes.filter(Boolean).map((l) => ({ pr: l.pr.id, opened: l.opened, kept: l.kept.map((t) => t.id), dropped: l.dropped, proof: l.proof, e2e: l.e2e })) }
```

## After each wave (the lead)

1. Read each PR's checks, body and screenshots yourself. Green counts only if you see it. A screenshot that does not show its claim means not done.
2. Write with one ArtifactData `batch`: `status/<ticket>` for every ticket (`built` once proven and reviewed, `blocked` with the reason when dropped; `done` waits for its final check), `status/pr-<id>` for every PR (state, number, url, base, sha, checks), `run/current`, and `log` rows for review, fix, proof, open and drop.
3. Put each opened PR in Needs you as `info` with its link and its place in the stack, and open any `hotfix` PR the wave's PRs name. Answer any feedback the wave addressed (`resolved`, `answer`).
4. Append to `agent/CHECKPOINT.md`: what opened, what was dropped and why, rulings, next step. Copy proof images into the book, rebuild, republish.
5. Read `feedback` and `decisions` again before the next wave. Pass the returned `tip` and every dropped ticket in `dropped`. If the person merged PRs meanwhile, the stack's bottom moved to the development branch; if the tip itself merged and its branch is gone, pass the development branch as `tip`.

## After the last wave: the final pass

The final pass runs the agreed checklist (`plan.verification`) once, on a fresh copy of the product that holds every PR. Pass the stack's `tip`, the runs in plan order and every check:

```json
{ "repo": "/abs/repo", "dev": "feat/x", "tip": "fix/finish", "app": "http://localhost:4000",
  "proofDir": "/abs/repo/docs/<book-id>/book/agent/proof", "privateDir": "/abs/private/proof", "rules": "the binding rules, short",
  "runs": [ { "id": "demo-run", "title": "...", "what": "...", "needs": "" } ],
  "checks": [ { "id": "...", "kind": "watch", "run": "demo-run", "title": "...", "say": "", "expect": "...", "pass": "..." } ] }
```

Checks without a `run` go first, together; each run then gets one agent with every check that names it. A run's measure checks are read before its asks change the estimate, and a run whose `needs` did not hold is skipped. Every check comes back with a result: one the agents never returned is `skipped`.

```js
export const meta = {
  name: 'book-final',
  description: 'Run the agreed checklist once on a fresh copy of the product built from the top of the PR stack',
  phases: [{ title: 'Fresh copy' }, { title: 'Checks' }],
}
const W = args
const DONE = { type: 'object', properties: { ok: { type: 'boolean' }, note: { type: 'string' } }, required: ['ok', 'note'] }
const RES = { type: 'object', properties: { results: { type: 'array', items: { type: 'object', properties: {
  check: { type: 'string' }, state: { enum: ['pass', 'fail', 'skipped'] }, saw: { type: 'string' }, proof: { type: 'array', items: { type: 'string' } } },
  required: ['check', 'state', 'saw'] } } }, required: ['results'] }
const fresh = await agent(`In ${W.repo}: git fetch --prune, check out origin/${W.tip} detached (the top of the stack holds every PR; origin/${W.dev} if that branch is gone ` +
  `because it merged), install, and restart the one local stack the way the repo says so it serves exactly this code. Clear older test Projects the way the product ` +
  `allows at ${W.app}. Put the full commit id it serves in note. Rules: ${W.rules}`, { label: 'fresh', phase: 'Fresh copy', schema: DONE })
if (!fresh?.ok) return { stopped: fresh?.note || 'the fresh copy did not start' }
const check = (label, brief) => agent(`You run agreed checks on the one local stack at ${W.app}, serving commit ${fresh.note} of ${W.repo}, with the in-app browser pane ` +
  `(never the person's own browser). Do exactly what each check says and judge it only by its pass line; report what you saw, not what should happen. Return one ` +
  `result for every check id; one you could not run is skipped, with why. Save screenshots of made-up data as ${W.proofDir}/check-<check id>-<n>.png and anything ` +
  `showing a real bid only in ${W.privateDir}. Rules: ${W.rules}\n${brief}`, { label, phase: 'Checks', schema: RES })
const results = []
const settle = (list, res, why) => { const got = new Map((res?.results || []).map((r) => [r.check, r]))
  list.forEach((c) => results.push(got.get(c.id) || { check: c.id, state: 'skipped', saw: why })) }
const held = (id) => { const mine = W.checks.filter((c) => c.run === id), m = mine.filter((c) => c.kind === 'measure')
  return (m.length ? m : mine).every((c) => results.find((x) => x.check === c.id)?.state === 'pass') }
const quick = W.checks.filter((c) => !c.run)
if (quick.length) settle(quick, await check('without-a-run', JSON.stringify(quick, null, 2)), 'no result came back')
for (const r of W.runs) {
  const list = W.checks.filter((c) => c.run === r.id)
  if (!list.length) continue
  if (r.needs && !held(r.needs)) { settle(list, null, `not run: ${r.needs} did not hold`); continue }
  settle(list, await check(`run:${r.id}`, `Make a fresh Project for this run and take it as far as it says: ${JSON.stringify(r)}. Take every measure check first, at ` +
    `the point the run names and before any typed request changes the estimate. Look for every watch and screen check while it runs. Then type each ask check's ` +
    `say words in the Chat exactly, in the order listed, and judge each reply.\n${JSON.stringify(list, null, 2)}`), 'the run stopped')
}
return { commit: fresh.note, results }
```

1. Read every result and its evidence yourself; only the lead writes `pass`, into `status/check-<id>` (`{ state, note, proof, at }`), after seeing it. Write every other result too, so nothing reads as not yet run.
2. A failing check gets one fix round: fix it in the PR that owns its ticket (a fix to a PR lower in the stack, above), then run that check again with the same script and only that check (and its run). Still failing, it stays `fail` with the reason. Never weaken a check to make it pass.
3. Set each ticket whose checks all passed to `done`; one with a failing or skipped check stays `built`, its note naming the check.
4. A cold reviewer reads the log, the PRs, the checklist results and the evidence and writes `report.attention`.
5. Fill the report (`report.md`), with totals counted from the PRs themselves, not from memory. The PRs stay open; the report lists them in merge order.

## Stop rules (ask the user only when)

- A decision that blocks the next wave is unopened.
- The local stack cannot be made healthy after two tries, or a `ready` item a person must supply is missing or unconfirmed.
- Real data shows the plan is wrong.
- An action needs a yes the book does not already give (deleting real data, a cloud migration, a production release, anything outward-facing).

Otherwise keep going and record each ruling in the log.

## Memory across sessions

Before the context fills, and at the end of every wave, the book must be enough to resume: status and log in the db, CHECKPOINT current, content republished. A resumed session runs Orient again and continues from `run/current`; the Workflow tool's `resumeFromRunId` reuses finished agent calls.
