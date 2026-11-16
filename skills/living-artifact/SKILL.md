---
name: living-artifact
description: Run a piece of work the user does himself with coding agents through ONE living HTML artifact (the book), from the first question to the proof. The book has five sections in a left sidebar, Summary, Problems, Tickets, Plan and Proof; a problem or ticket opens in a side panel beside its list, and a problem shows what we found, the fix with pictures and prototypes, the outcome and its tickets; the plan is tickets in parallel waves built from a dependency graph and file ownership, with the reviews and browser checks placed where the risk is. Use when the user brings problems to explore, asks for research, a plan, tickets or waves for agents, wants to run or resume a build from a book, gives feedback on a book, or asks what was proven. Not for handing tasks to a team.
---

# The living artifact

One book per piece of work. It is the plan, the live tracker and the proof. Nothing about the work lives anywhere else: not in long markdown, not in a second artifact, not in chat scrollback. Any session can pick the work up from the book's URL alone.

**Who it is for.** Work the user runs himself with coding agents: he reads the book, the agents build. It is not for handing tasks to people on a team; a team list is a different document with owners and its own shape.

## The page

A left sidebar shows one section at a time (a compact top bar on a phone), with a three icon theme control and a Human or Agent switch at its foot. A toggle at its top (or the `[` key) collapses it to a rail of section icons with counts, remembered per viewer. Calm and short:

1. **Summary**: title, one line, a headline and two or three short paragraphs, and 3 to 6 real numbers (a measured number today and its target).
2. **Problems**: one quiet list, a row per problem with severity, area and a status worked out from its tickets (Not started, Working, Completed), filtered by area. A row opens a detail panel on the right that scrolls on its own, resizes from its left edge, expands or goes full screen, and follows as he clicks other rows: the problem, why it is a problem, what we found (each line with its evidence), the fix (visuals first), the outcome we want, and the tickets that fix it.
3. **Tickets**: the same list and panel. A row shows its status from the db and chips for its wave and pull request; the list groups by wave, pull request or problem. The panel shows the problem it fixes, what the agent will do, how, the files, what it depends on, its proof and, once done, its evidence and commit.
4. **Plan**: the goal, counts the build computes, then the waves: what each does for him (`why`, and `gives`: what he has when it is done), its tickets, and the junctions after it. Then the pull requests and how we prove it. While a run is live, its current step and recent log sit at the top as one quiet line.
5. **Proof**: a completion report that fills in as work lands: what is done out of what was planned, each pull request with its link and state, each ticket's evidence tied to a commit, and what was not verified.

Agent mode lists the raw files. There is no Progress section (status lives on the rows), no decisions section, timeline, kickoff panel, history tab or milestone list: questions go to the user in chat, anything still open goes in `agent/CHECKPOINT.md`, and the kickoff and earlier rounds are agent files.

## The loop

```
ask -> explore problems <-> (feedback) -> plan <-> (feedback) -> run waves -> prove -> (feedback) -> next round
```

`book.json.stage` is `plan`, `build`, `verify` or `done`. Feedback starts a new round in the same book: freeze `book.json` to `agent/rounds/round-<n>.json`, prepend the new words to `agent/ASK.md`, and go back to the stage the feedback needs. Read `references/method.md`; it is the core of this skill.

## Roles

- **The session that runs the book orchestrates.** It plans, starts agents, places the junctions, writes the db and republishes. It does not build tickets itself.
- **Opus agents execute tickets**, one agent per ticket, and do every browser check.
- **A Fable agent reviews every pull request**: reads the change, critiques it, improves it or sends it back. Fable never drives a browser.

## Always

1. **Capture the ask verbatim** in `agent/ASK.md`, newest first, and check every ask line maps to a problem or a ticket before the plan ships.
2. **Ground every claim** in a file and line, a screenshot, a measurement, or the user's words. Findings and research are one thing: what we found, with its evidence.
3. **Industry first, simplest first.** Each fix says how a named product does it and what we will not do.
4. **Ask in chat, not on the page.** During planning, put every open question to the user directly. Never park a question in the book for him to find.
5. **The work decides the ticket count.** One ticket is one commit by one agent; never aim for a number the user mentioned.
6. **Waves are for parallel work.** Build the dependency graph. A ticket goes in the earliest wave where everything it depends on is in an earlier wave and no other ticket in that wave edits the same file. One agent and one commit per ticket. `references/planning.md`.
7. **No time estimates anywhere.** Count tickets, waves, pull requests, commits, reviews and checks instead.
8. **Proof, not claims.** Every ticket names its proof; a ticket is verified only when that proof is seen and tied to a commit. What was not verified is said plainly on the Proof tab.
9. **The book is the state.** Write `status`, `run` and `log` to the db as you go; republish when content changes. A fresh session must lose nothing.
10. **Plain words**: no em or en dashes, no internal codes in human text, the user's vocabulary.

## Files

- `references/method.md`: the stages, from the ask to the next round.
- `references/data-model.md`: book.json version 2, agent files, the db. The contract.
- `references/design.md`: how each section reads and looks, word budgets.
- `references/planning.md`: tickets, the dependency graph, waves, junctions, pull requests, how we prove it.
- `references/run.md`: running the waves, the junctions, status writes, filling Proof.
- `references/kickoff.md`: the kickoff prompt, kept as an agent file.
- `scripts/build.mjs`: `node scripts/build.mjs <book-dir>` checks book.json, computes the plan counts, writes index.html, prints the files map.
- `assets/book.html`: the page template. Improve it here, never fork it per project.
- `examples/sample-book/`: a complete version 2 book with a db seed.
- `research/`: the sources this skill is built on.

## Publishing

Local working copy: `<repo>/docs/<book-id>/book/` (never staged). Build, then publish `index.html` with the Artifact tool, `files` from the build output, and on the first publish only the db capability from `references/data-model.md`. Republish with the same `file_path` so the URL never changes. Put the URL in `book.json.links` and in `agent/CHECKPOINT.md`.

## Pitfalls

- A second artifact for the same work. Republish the book.
- A busy page. If a section needs more than its word budget, the detail goes to an agent file.
- Waves sized for equal shares. A wave holds everything that can start at once; it can hold one ticket or twenty.
- Two tickets that edit the same file in one wave. The build refuses it; split the work or move one ticket to the next wave.
- The same junctions after every wave. Place a review, a browser check or a merge where this plan's risk is.
- A page that lies. If the run does not write status, every row shows stale work as current.
- Treating the planning chat as memory. Write it into the book; the next session will not have the chat.
