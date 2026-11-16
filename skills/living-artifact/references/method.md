# The method, stage by stage

Each stage ends with a republished book and a `log` row. Feedback can move the book back to any stage.

## 1. The ask (minutes)

- Save the user's words verbatim in `agent/ASK.md`, newest first. List every ask as one line under them.
- If the goal is unclear, ask him in chat until you can name the problems. Do not guess and do not park questions on the page.
- Publish the book at stage `plan` as soon as the Summary has a headline, so he can watch it fill.

## 2. Explore the problems (the longest stage on a big piece of work)

Produce `problems`, each one complete, and files under `agent/research/`.

- **Read what exists first.** Code, data, screens. Cite file and line. Screenshot today's product into `shots/`.
- **Research in parallel.** One background agent per open question: how the industry does it, the official primitive or library, what our code already has. Each writes `agent/research/<topic>.md` that opens with its recommendation and cites sources. What it finds goes into the problem's `found`, each line with its evidence. There is no separate research section.
- **Show the fix.** For a screen change, capture today, apply the fix in a throwaway copy, and capture the result: a `Today` and a `Proposed` image. For something new, build a small prototype in `proto/` that opens full screen. For a system change, a diagram. Visuals live in the problem's fix.
- **Write each problem in this order:** the problem, why it is a problem, what we found, the fix (summary, points, what we will not do, how a named product does it, the visuals), the outcome we want. Write it for someone who has not read anything else.
- **Critique through the user's eyes.** Is it clear, is it simple, is it how the industry works? Fix and look again until a pass finds nothing important.

Exit: the user agrees with the problems and the fixes, in chat.

## 3. Plan

Produce `plan` and the Summary. Read `planning.md`.

1. Write tickets from the problems: each names its problem, what the agent will do, the steps, the files it edits, what it depends on, and its proof. The count of tickets comes from the work: one ticket is one commit by one agent. Never aim for a number the user mentioned; a figure he says in passing is a sense of scale, not a target.
2. Build the dependency graph and place each ticket in the earliest wave it can run in. The build checks it.
3. Group tickets into pull requests by problem category; each ticket is one commit.
4. Place the junctions where this plan's risk is: a Fable code review for every pull request, a critical review where the change is wide, an Opus browser check where a person will see the change, a merge where the founder must merge before work can go on.
5. Give each wave a `why` (what it does for him) and a `gives` (what he has when it is done).
6. Write how we prove it: the strategy in a few sentences and the checks.
7. Write the Summary last: a headline, two or three short paragraphs, 3 to 6 real numbers.
8. Write the kickoff to `agent/prompts/kickoff.md` (`kickoff.md`).
9. Check every ask line maps to a problem or a ticket. Ask the user anything still open in chat; record what is still open in `agent/CHECKPOINT.md`.
10. **Critique cold.** One agent that has not seen the work reads only the published book and says what is unclear, overbuilt or missing. Fix it.

Exit: the user says to run.

## 4. Run

Read `run.md`. Wave by wave: one Opus agent per ticket, all at once, one commit each; then the wave's junctions; status and log written as it goes.

## 5. Prove

Fill `proof` as the evidence comes in: each pull request with its link and state, each ticket's evidence tied to its commit, and everything not verified. Set `stage` to `verify` while the last checks run and `done` when they have. Republish and tell the user with the book link.

## 6. Next round

Feedback starts round n+1 in the same book:
1. Freeze `book.json` to `agent/rounds/round-<n>.json`.
2. Prepend the new words to `agent/ASK.md`; list each new ask.
3. Add, change or close problems; carry forward what the user already settled.
4. Go back to explore or plan as the feedback needs. Republish.
