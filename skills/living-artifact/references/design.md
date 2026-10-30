# How human mode reads

The reader is the owner or a teammate, busy, not reading code. The template in `assets/book.html` does the layout; this file is about what you put in the data so the page stays calm.

## The first screen

Needs you (what waits on the reader, with jump links), then the three to five outcome claims, then the stage stepper showing where we are. If a reader stops there, they know the problem, the end state, the stage and their next action.

## Word budgets

| Field | Budget |
|---|---|
| tagline | 15 words |
| problem.statement | 50 words |
| an outcome claim | 30 words |
| a finding, a solution | 25 words each |
| a research answer | 40 words; recommendations 15 words each |
| architecture frame caption | 20 words |
| ticket goal | 50 words; each done-when 20 words |
| decision question and why | 15 and 30 words; each option effect 12 words |
| report lines | 25 words each |

Anything longer goes into an agent file and the field links it.

## Pictures over prose

- Every outcome has an icon; every architecture change is a frame that adds one part; every plan has the wave diagram and the milestone roadmap.
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
