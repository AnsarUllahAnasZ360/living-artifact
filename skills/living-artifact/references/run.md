# Running the waves

The run is a session opened in the repo, started by the kickoff (`agent/prompts/kickoff.md`). The session orchestrates: it starts agents, makes the commits, runs the junctions, writes the db and republishes. Opus agents build tickets and do browser checks. A Fable agent reviews every pull request. Nobody waits on a time estimate; the plan's order is the only schedule.

## Orient (from the book alone)

1. `Artifact read` the book URL. Restore the working copy if this machine lacks it: `Artifact read` with `paths` for every published file into `<repo>/docs/<book-id>/book/`.
2. Read `agent/CHECKPOINT.md` (where the last session stopped and what is still open), `agent/ASK.md`, and the research files the tickets cite.
3. ArtifactData `list` on `status` and `run`. Continue from `run/current`; never redo a ticket whose status is `built` or later.
4. Read the repo's CLAUDE.md or AGENTS.md. Find the one local stack and who owns its processes; never start a second copy.
5. Check what the checks need (accounts, sample files, a baseline) and ask the user once in chat for anything only he can supply. Then write `run/current` (`phase: ready`) and a `log` row of kind `start`.

## Branches and commits

- **One worktree per pull request**, on its branch, from its `base`. If a ticket depends on a ticket in another pull request, its pull request is stacked on that one (its base is that branch) or the plan placed a merge before it.
- **Agents never run git.** When a ticket's agent finishes, the orchestrator stages exactly that ticket's `files` (plus any test file the agent names) in the pull request's worktree and makes one commit, subject naming the ticket. Tickets in one wave never share a file, so commits never collide.
- **Fixes fold into their ticket.** A fix from a review or a failed proof goes in as `git commit --fixup=<ticket sha>` and `git rebase --autosquash <base>`, so each ticket stays one commit.
- Pull requests merge with a merge commit so each ticket can be reverted alone. They stay open for the founder unless a merge junction says otherwise.

## One wave

1. Read `status` again. Drop any ticket whose dependency is `blocked`, with the reason in its status.
2. In one message, start one Agent per ticket in the wave, `model: "opus"`, all at once. Each brief carries: the ticket (problem, does, how, files, proof), the pull request's worktree path, the problem's fix and outcome from the book, the repo's rules, "edit only your files; do not run git; run the area's tests and your proof; report what you saw".
3. As each agent returns: read its result yourself; if its proof passed, commit it and write `status/<ticket>` as `built` with the note and sha; if not, send it back once with the failure, then mark it `blocked` with the reason. Write a `log` row either way.
4. Keep `run/current` true: `{ wave, phase: "building", note, at }`.

## The junctions

After the wave, run exactly the junctions the plan placed, in order.

- **code-review (Fable).** Start an Agent with `model: "fable"` on the pull request: its diff against its base, its tickets, their problems and proofs. It critiques, then improves the change in the worktree or sends a finding back. Fold each fix into its ticket's commit and rerun that ticket's proof. When it passes, push the branch, open or update the pull request with `gh`, set its tickets to `reviewed`, and write `status/pr-<id>` (state, number, url, base, sha, checks).
- **critical-review (Fable).** A Fable agent reads the whole change it names against the problems and outcomes: what a user would still trip on, what is overbuilt, what is missing. Fixes go back to the ticket that owns them.
- **browser-check (Opus).** An Opus agent drives the browser the repo allows on the local stack running the change, does what the junction says, and saves screenshots of made up data to `agent/proof/<ticket>-<n>.png`. Fable never drives a browser. Anything showing real customer data stays out of the book; the book gets the verdict in words.
- **merge (Founder).** Stop and ask the founder to merge the named pull requests. Continue when he says so.

A ticket becomes `verified` when its check under How we prove it passed and the evidence is tied to its commit. Only the orchestrator writes `verified`, after seeing the evidence.

## Filling Proof

As evidence comes in, write `proof` in book.json and republish:

- `proof.prs`: each pull request's link and state.
- `proof.items`: per ticket, what was shown, the evidence (`image` with an optional `before`, `text` test output, or a `number`), and the commit it saw. Copy images into `agent/proof/`.
- `proof.not_verified`: every ticket or check without proof, every dropped ticket and why, said plainly.

The Proof section reads these with the live status, so it fills in as work lands. Set `stage` to `verify` while the last checks run and to `done` after. Tell the user with the book link and the pull request links.

## Stop and ask only when

- Something only the user can supply or decide is missing.
- The local stack cannot be made healthy after two tries.
- Real data shows the plan is wrong.
- An action needs a yes the book does not give: deleting real data, a cloud migration, a production release, anything outward facing.

Otherwise keep going and record each ruling in the log and in `agent/CHECKPOINT.md`.

## Memory across sessions

At the end of every wave, and before the context fills, the book must be enough to resume: status, run and log in the db, `agent/CHECKPOINT.md` current, content republished. A new session runs Orient and continues from `run/current`.
