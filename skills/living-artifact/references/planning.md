# Planning: tickets, waves, junctions, proof

## A ticket

One change one Opus agent makes and proves, landing as one commit. It is tied to one problem.

| Field | Purpose | Good | Bad |
|---|---|---|---|
| title | The outcome, verb first | Write CSVs for QuickBooks, Xero and FreeAgent | CSV stuff |
| problem | The problem id it fixes | copy-by-hand | |
| does | What the agent will do, in a sentence or two | Adds three presets and a writer that uses the month range | Improve export |
| how | The steps, short | Write the presets from each tool's guide; compare with each sample file | |
| files | Every file it edits | apps/api/src/export/csv.ts | apps/ |
| depends_on | Tickets whose result it needs | range-in-account-zone | |
| proof | How it is proven: test, browser or measure, and what is shown | Each preset's file imports cleanly | Works |

Size: big enough to be worth a commit and a review, small enough for one agent. The ticket count is whatever the work needs, never a number the user mentioned. Do not split one change into tiny tickets, and do not bundle unrelated changes to save tickets. Name files exactly; the wave rule depends on it. When a ticket truly cannot know its files yet, name the narrowest folder and keep it out of any wave that touches that folder.

## Waves come from the graph

Waves are about running in parallel, not about equal shares. A person works one item at a time; agents do not need to. Two tickets can run at the same time unless one needs the other's result, or both edit the same file.

1. List every ticket with its files and what it depends on.
2. Wave 1 holds every ticket that depends on nothing.
3. Each later wave holds every ticket whose dependencies all sit in earlier waves.
4. If two tickets in a wave edit the same file, move the one with fewer tickets waiting on it to the next wave (or split the file's change into its own ticket that both depend on).
5. Repeat until every ticket is placed. A wave can hold one ticket or twenty.

In a wave the orchestrator starts one agent per ticket, all at once, in one message. Each ticket lands as one commit. The build refuses a dependency in the same or a later wave and two tickets in one wave that edit the same file, and warns when a ticket could have run in an earlier wave.

Shared hot files (routes, a registry, a config) are where parallel agents collide. Prefer one small ticket that makes the shared edit early, so later tickets do not all touch it.

## Junctions: what happens between waves

After a wave the plan places only what that point needs. Junctions are not the same for every plan.

| Kind | Who | When to place it |
|---|---|---|
| code-review | Fable | Once per pull request, after the wave that finishes its last ticket. Fable reads the change, critiques it, improves it or sends it back. |
| critical-review | Fable | Where a change is wide or risky: across several pull requests, money, auth, data, prompts. Reads the whole against the problems, not line by line. |
| browser-check | Opus | Where a person will see the change, or before later waves build on a screen. Fable never drives a browser. |
| merge | Founder | Where later work must start from merged code, and at the end. |

Each junction says what it covers in one line. The build counts code reviews and browser checks for the Plan's strip and warns when there are fewer code reviews than pull requests.

## Pull requests

Group tickets into pull requests by problem category. A pull request may carry tickets from several waves; it is reviewed after the wave that finishes its last ticket. Each ticket is one commit on its branch, so history, review and revert still go ticket by ticket. Give each a short title and a branch. Pull requests stay open for the founder to merge unless a merge junction says otherwise.

## How we prove it

Write `plan.verification` before anything is built, and keep it small.

- **strategy**: a few sentences. What each ticket proves on its own, who reviews, and the final pass (for example: one Opus agent runs the main path end to end on a fresh copy holding every pull request).
- **checks**: each says what is done, what counts as passing, who runs it, and which tickets it covers. Kinds: `test` (a test or a read only command), `browser` (an Opus agent walks a screen), `measure` (a number against a baseline taken on the same inputs), `review` (a Fable read). One check can cover several tickets; every ticket should be in at least one.

Probe what the checks need while planning (a test account, a sample file, a baseline). A check that needs something nobody has supplied is a promise, not a plan: ask the user in chat.

A ticket is `verified` only when its proof is seen and tied to a commit. A check that fails gets one fix round; if it still fails, it goes under Not verified on the Proof tab. Never weaken a check to pass it.

## Simplicity rules agents carry

- The fewest lines that meet the proof. Reuse what exists; prefer the official primitive or library.
- Delete code and tests the change makes dead.
- Tests prove behaviour a person cares about, never restate the code.
- No new dependency without a line saying why.
