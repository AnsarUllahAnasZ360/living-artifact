# How human mode reads

The reader is the owner or a teammate, busy, not reading code. The template in `assets/book.html` does the layout; this file is about what you put in the data so the page stays calm.

## The first screen

The executive summary and Needs you share the first screen: the summary on the left (one headline a stranger understands, up to six numbers, when things land, up to eight points that each open their detail), Needs you on the right in a tinted panel (what waits on the reader, with jump links). On a laptop or wider they sit side by side; on a tablet or phone Needs you follows the summary. The stage stepper sits on top. If a reader stops there, they know the problem, the fix, when it lands, the stage and their next action.

## Layout

The page is fluid, not a fixed column. Running text keeps a reading measure (about 68 characters); grids, diagrams and the wave plan spread across the width. Sections lay themselves out by the width they get (container queries), so the same rules hold in a narrow window on a big screen:

| Width | What changes |
|---|---|
| Phone, 375 | One column, 16 px gutters, no sideways page scroll; the wave plan runs top to bottom, wave by wave; the PR detail fills the screen |
| Tablet, 768 to 1023 | The section list becomes a drawer behind the menu button; findings and research go two up |
| Laptop, 1280 | Summary and Needs you side by side; the wave plan in columns with arrows |
| Wide, 1600 and up | More columns where the content allows (research up to three); a PR block wider than about 540 px lists its commits in two columns |

Calm comes from whitespace, type and hairlines, with tinted bands for the few things that must stand apart (Needs you, the wave plan, a diagram, the blocked-on-you band). Borders are for controls only. Never a bordered box around a paragraph.

## The plan reads as waves of PRs

The wave plan is the hero of the Plan section. Waves are columns left to right; each holds the PR blocks built at the same time, each block showing its category, title, its commits in order with status dots, the commit count, risk and approver. Arrows show which PR waits for which; hovering or focusing a block lights its arrows. Each wave ends with its gate. A stacked PR carries a small "On top of" tag, a hotfix a small branch-off, a dropped commit is struck through. Opening a block shows the PR detail: problem, outcome, risk, approver, what it waits for and unblocks, the branch, the commits in order with each done-when, the proof shown before it opens, the areas it owns and the files it also edits. Milestones list the PRs whose merge reaches them. Write PR titles and outcomes so the wave plan alone tells the story.

How it ships draws the two loops (for every commit, for every PR), the branches, review by risk, the merge rules and a preview of the PR body. The report opens on what is blocked on the reader, then big numbers (PRs opened and merged, approvals, commits, lines added and deleted), where the lines went, the tests by kind, then what works, what is proven and what is not.

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
| PR title; PR problem; PR outcome | 10, 40 and 30 words |
| ticket goal | 50 words; each done-when 20 words |
| decision question and why | 15 and 30 words; each option effect 12 words |
| report lines (blocked on you, changed, found, works now, not proven) | 25 words each |

Anything longer goes into an agent file and the field links it.

## Pictures over prose

- Every outcome has an icon; every architecture area has a today and a proposed picture with steps; every plan has the wave plan of PRs, the milestone roadmap and How it ships (the two loops, branches, review by risk, the merge rules, the PR body).
- A diagram has at most 12 nodes and a caption. More detail is a second frame, not a bigger picture.
- Use numbers where they exist: tickets, PRs, waves, latency, lines deleted.
- Motion explains order (frames stepping in, a PR block lifting on hover) and nothing else. It respects reduced motion.

## Words

- The user's vocabulary, short sentences, verbs first in titles.
- No em or en dashes, no internal codes (ticket ids, gate numbers, decision numbers) in human text. Ids live in `id` fields and agent mode.
- No "we will leverage", no hedging, no praise.
- Every claim about today's product has evidence one click away.

## Greyed, never hidden

Sections whose stage has not come (prototypes before explore ends, progress before the run, the report before it is ready) show greyed with one line on when they fill in. The reader sees the whole shape of the work from day one.

## Agent mode

Monochrome and dense: the file tree, raw files, raw book.json, every db collection, and the copy digest. It is for an agent or an engineer who wants the truth without design.
