# The method, stage by stage

Each stage ends with a republished book and a `log` row. A stage moves on when its exit is met; feedback can move it back.

## Decisions and questions

This rule holds in every stage.

1. **Decide first.** For every open choice, take the best option, act on it, and record it in `decided`: what, who (`model` or the person), when, why. Facts are found by reading, measuring or trying, never asked.
2. **Ask only when all three hold:** the choice turns on the person's own taste, money, risk appetite or outside commitments; no experiment, source or default can settle it; and a wrong guess is costly to undo. You must be able to say in one sentence why you cannot decide. "It might matter" is not a reason.
3. **Ask in the chat, never in the book.** One message, at most three questions, each with the default you will take and when ("I will go with no standby database unless you say otherwise before the build starts"). Work goes on with the default unless the choice truly blocks.
4. **Record the answer** in `decided` with the person's name. A choice the model made reads "decided by the model" and stays open to challenge in chat.
5. **The one exception.** When a choice from rule 2 blocks the work and the person has not answered, set `blocking` (or `run/blocking`): the status line says so in one sentence and links to one card with the question, the options and why you cannot choose. Remove it once answered.

Zero questions is the normal case. Never ask a person to do set-up that access already covers (test data, uploads, accounts you can create).

## 1. Frame (minutes)

Produce: `agent/ASK.md`, `profile`, the story section.

- Save the person's words verbatim, newest first. List every ask as one line; the plan is checked against that list.
- Write the story: one claim a stranger understands, one sentence on today's pain and what we build, up to three numbers with certainty marks.
- Pick the profile: **feature** (one step, hours), **audit** (findings and fixes, no build unless fixes follow) or **large** (several steps of parallel work, days). Do not scale a feature up to look thorough.
- Publish at stage `explore` as soon as the story exists, so the person watches it fill.

Exit: the story says what the person asked for. If the goal is unclear, ask in chat once.

## 2. Explore (the longest stage on a big problem)

Produce: `findings`, `research`, files under `agent/research/`, and the sections that explain the solution.

- **Read what exists first.** Code, data, screens. Cite file and line in `findings`.
- **Research in parallel.** One background agent per open question: how the industry does it, the official primitives and libraries, what our own code already has. Each writes `agent/research/<topic>.md`, opening with Recommendations and citing sources.
- **Experiment.** When a run can settle a question (a layout, a latency, an accuracy), build a throwaway prototype or script and let the result decide.
- **Prototype screens** as `proto/<name>.html` when a clickable picture beats a description.
- **Show, then tell.** Turn what you learned into sections (`design.md`): why as before and after, how it works as a map with one job and one failure moving through it, what it can do, risks, scale and cost with assumptions in `book.model`. The found, recommend and why text stays in agent files, linked as `source`.
- **Critique through lenses.** For each kind of reader and each situation, ask: is it clear to a stranger, is it simple, is it how the industry does it? Fix and look again until a round finds nothing important.

Exit: the person agrees with the approach in chat, recorded in `log` and `decided`.

## 3. Plan

Produce: `plan`, the build section, the roadmap, `kickoff`. Read `planning.md`.

1. Start from what a person will be able to do, not from code.
2. List all the work: every finding, every ask line, every capability marked building.
3. Group it into goal-sized tickets and the tickets into steps (`plan.waves`) a person can follow. When the work ships through pull requests, add one PR per problem category, each ticket one commit (agent mode).
4. Write the verification plan with the plan: what must be ready, what agents check while building, the small final checklist.
5. Decide every open choice and record it (rule above). Ask in chat only under rule 2.
6. Write the kickoff (`kickoff.md`).
7. Check every ask line maps to a ticket, a decided record or a line in Beyond.
8. **Critique cold.** An agent that has not seen the work reads only the published page and answers: what is this for, what happens first, what would you ask before saying go, what is overbuilt, what is missing? Fix what it found.

Exit: the person says to run, in chat.

## 4. Run

A fresh chat in the repo, started by the kickoff. Read `run.md`.

- Orient only from the book: the page, its agent files, the db.
- Each step: builders work in parallel, proof takes turns on the one local stack, each PR opens as soon as it is proven, status and log are written as you go.
- Keep going; stop only on the stop rules.

## 5. Verify

- Run the agreed checklist once on a fresh copy built from the top of the stack. Every check gets a result; one never run counts as not proven.
- Real customer data never goes into the book, code, tests, commits or a PR.
- Each done-when gets a verdict with evidence and the commit it saw. Inconclusive is not a pass. Never weaken a check to pass it.
- A cold reviewer reads the log and the evidence and writes `report.attention`.

## 6. Report

Read `report.md`. The report is a state of the same sections: set `round.stage` to `report`, fill `report.works_now` and `report.not_proven` and the story's `after`, republish, and send the person the link.

## 7. Next round

Feedback starts round n+1 in the same book:

1. Freeze `book.json` to `agent/rounds/round-<n>.json`; add a `history` entry.
2. Prepend the new words to `agent/ASK.md`; list each new ask.
3. Keep decided records unless the person reopens one.
4. Go back to explore or plan as the feedback needs. Republish.

## Retro, any time

The book holds the whole story, so anyone can ask: "Read this book. What could have gone better, and how should the skill change?" Answer from the log, reviews, attention lists and rounds, in at most five changes. Put lasting lessons into this skill or the project's CLAUDE.md, not into the next prompt.
