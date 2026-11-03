# The method, stage by stage

Each stage ends with a republished book and a `log` row. The stage moves forward only when its exit is met; feedback can move it back.

## 1. Frame (minutes)

Produce: `problem`, `outcomes`, `profile`, `agent/ASK.md`.

- Save the user's words verbatim. List every ask as one line.
- If the goal is unclear, interview the user until you can write three to five outcome claims. A claim is one true or false sentence about what a person can do when we are done ("Anyone can search from any page and get results with sources in under two seconds"). Read the claims aloud: together they are the whole change.
- Each outcome gets done-when statements a person can check.
- Publish the book at stage `explore` the moment the frame exists, so the user watches it fill.

Exit: the user agrees with the claims (a `gates/frame` approval, or a yes in chat recorded in `log`).

## 2. Explore (the longest stage on a big problem)

Produce: `findings`, `research`, `architecture`, `prototypes`, files under `agent/research/`.

- **Read what exists first.** Code, data, screens. Cite file and line. Screenshot today's product.
- **Research in parallel.** One background agent per open question: how the industry does it, the official primitives and libraries, what competitors do, what our own code already has. Each writes one `agent/research/<topic>.md` that opens with Recommendations and cites sources.
- **Experiment.** When a run can settle a question (a layout, a latency, a model's accuracy), build a throwaway prototype or script and let the result decide. Ask the user only questions of taste and product.
- **Prototype screens.** A clickable prototype beats a description. Publish it as `proto/<name>.html` in the book (or link its own artifact). Keep variant switchers.
- **Critique through lenses.** For each persona (the user, the subject matter expert, the customer's customer) and each situation (doing it by hand, reviewing the AI's work, coming back later), ask: is it clear, is it simple, is it how the industry works? Fix and critique again until a round finds nothing important.
- **Explain the solution, area by area** (`architecture.areas`). The reader asked for a fix, not a diagram. For each part of the solution say, in this order: what we found (one concrete example, with evidence), what we recommend, a today picture and a proposed picture, how it works as numbered steps that light up the parts they name, why this is the right fix (the industry pattern, what it reuses, what it avoids), what people will notice, the trade-offs, what we will not build, and the tickets that carry it. Use `frames` only for one picture of the whole system.
- **Write the executive summary last, show it first** (`summary`): one headline a stranger understands, the numbers that matter, when things land, and a point for each part of the story that opens its detail.
- Each finding pairs with its solution and the tickets that will carry it.

This stage loops with the user many times. Each loop: republish, log what changed, read feedback.

Exit: the user approves the approach (`gates/explore`, or a yes in chat recorded in `log`).

## 3. Plan

Produce: `plan`, `decisions`, `kickoff`. Read `planning.md`.

1. Start from the goals and outcomes, not from code.
2. List all the work. Every finding, every done-when, every ask line.
3. Group the work into goal-sized tickets, the tickets into one PR per problem category (each ticket one commit), and name three to seven milestones as outcomes a person can see.
4. Schedule the PRs into waves for the most parallelism the files and dependencies allow. Foundations first, screens later, proof last.
5. Put verification where it pays: every ticket proves itself and is reviewed before its commit is final, every PR is reviewed whole and run end to end before it opens, the end has the full walk and real data.
6. Every choice that is the user's goes in `decisions` with a recommendation and its effect, attached to what it changes.
7. Write the kickoff from `kickoff.md`.
8. Check every ask line maps to a ticket, a decision, or a stated reason in `plan.later`.
9. **Critique cold.** One agent that has not seen the work reads only the published book and answers: what is this for, what happens first, what would you ask before approving, what is overbuilt, what is missing? Fix what it found.

Exit: `gates/plan` approved by the user, or the user says to run.

## 4. Run

A fresh chat opened in the repo, started by the kickoff. Read `run.md`.

- Orient only from the book: read it, its agent files, the db. No other docs.
- Each problem category ships as one PR into the development branch, one commit per ticket. Review and proof happen before a PR exists: per ticket before its commit is final, per PR before it opens.
- Each wave: read feedback and decisions, one builder per PR works its tickets in order, proof takes turns on the one local stack, each PR opens as soon as it is proven, write status and log, republish if content changed.
- Do not stop for a mid-run review unless the kickoff says so. Stop only on the stop rules in the kickoff.

## 5. Verify

- Walk every outcome claim end to end on the merged app, as each persona.
- Run real data where the book names it. Real customer data never goes into the book, code, tests, commits or the PR.
- Each done-when gets a verdict: verified, not verified or inconclusive, with evidence and the commit it saw. Inconclusive is not a pass.
- A cold reviewer reads the log and the evidence and writes `report.attention`: weak proof, skipped checks.
- Fix loop until a full pass finds nothing new.

## 6. Report

Read `report.md`. Fill `report`, set `report.ready`, stage `report`, republish, finish the PR description, notify the user with the book link.

## 7. Next round

Feedback from the user or the team starts round n+1 in the same book:
1. Freeze `book.json` to `agent/rounds/round-<n>.json`; add the `history` entry with numbers and outcome.
2. Prepend the new words to `agent/ASK.md`; list each new ask.
3. Mark which earlier outcomes still hold; carry forward settled decisions.
4. Go back to explore or plan as the feedback needs. Republish.

## Retro, any time

The book holds the whole story, so anyone can ask a model: "Read this book. What could have gone better, and how should the skill change?" Answer from the log, the reviews, the attention lists and the rounds. Put lasting lessons into this skill or the project's CLAUDE.md, not into the next prompt.
