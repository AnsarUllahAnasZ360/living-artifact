# How human mode reads

The reader is the owner or a teammate, busy, not reading code. The template in `assets/book.html` does the layout; this file is about what you put in the data so the page stays calm.

## The first screen

The executive summary: one headline a stranger understands, up to six numbers, when things land, and up to eight points that each open their detail (a finding, an architecture area, the PR plan, Needs you). Then Needs you (what waits on the reader, with jump links), then the three to five outcome claims, with the stage stepper on top showing where we are. If a reader stops there, they know the problem, the fix, when it lands, the stage and their next action.

## Architecture explains, it does not just draw

A diagram alone tells a busy reader nothing. Each architecture area answers, in order: what did we find (one concrete example, with evidence they can open), what do we recommend, how does it work (today and proposed pictures, then numbered steps that light up the parts they name), why is this the right fix, what will people notice, what do we accept and what will we not build, and which tickets build it. Write each as if to someone who has not read the findings. Name parts as the user would ("the lead agent", "the product library"), never by file or class names; files go in the evidence chips.

## Word budgets

| Field | Budget |
|---|---|
| tagline | 15 words |
| problem.statement | 50 words |
| an outcome claim | 30 words |
| a finding, a solution | 25 words each |
| a research answer | 40 words; recommendations 15 words each |
| architecture frame caption | 20 words |
| summary headline; each summary point | 25 words; 40 words |
| architecture area: found, recommend | 90 words each |
| architecture area: why, user sees | 70 and 50 words |
| architecture area: each step | 30 words |
| finding detail, solution detail | 80 words each |
| ticket problem, solution, why this fix | 60, 120 and 60 words |
| PR title | 10 words |
| ticket goal | 50 words; each done-when 20 words |
| decision question and why | 15 and 30 words; each option effect 12 words |
| report lines | 25 words each |

Anything longer goes into an agent file and the field links it.

## Pictures over prose

- Every outcome has an icon; every architecture area has a today and a proposed picture with steps; every plan has the wave diagram, the milestone roadmap and the PR plan (branches, stacks, review by risk, the merge checklist).
- A diagram has at most 12 nodes and a caption. More detail is a second frame, not a bigger picture.
- Use numbers where they exist: tickets, waves, agents, latency, lines deleted.
- Motion explains order (the wave walk, frames stepping in) and nothing else. It respects reduced motion.

## Words

- The user's vocabulary, short sentences, verbs first in titles.
- No em or en dashes, no internal codes (ticket ids, gate numbers, decision numbers) in human text. Ids live in `id` fields and agent mode.
- No "we will leverage", no hedging, no praise.
- Every claim about today's product has evidence one click away.

## Greyed, never hidden

Sections whose stage has not come (prototypes before explore ends, progress before the run, the report before it is ready) show greyed with one line on when they fill in. The reader sees the whole shape of the work from day one.

## Agent mode

Monochrome and dense: the file tree, raw files, raw book.json, every db collection, and the copy digest. It is for an agent or an engineer who wants the truth without design.
