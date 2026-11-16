# How the page reads

The reader is the user, busy, not reading code. The template in `assets/book.html` does the layout; this file is about what you put in the data so the page stays calm.

## Calm

- A left sidebar with five sections, one shown at a time: Summary, Problems, Tickets, Plan, Proof, each with an icon and, for Problems and Tickets, a count. Its foot holds the theme (three icons: light, dark, auto) and a Human or Agent switch. A panel icon at its top collapses it to a narrow rail: one icon per section with a tooltip and the count as a small badge, and the theme and view controls tucked into one popover. The same toggle, or the `[` key when focus is not in a field, expands it again; the content takes the freed width. The choice is remembered per viewer in local storage, and the page works without it. On a phone it becomes a compact top bar that stays reachable, collapsed or not.
- One idea per screen. A problem or a ticket opens in a detail panel on the right, beside its list; the list stays, so clicking another row swaps the panel. The panel scrolls on its own, resizes by dragging its left edge, and its header names the item, its place in the list (3 of 11) with Previous and Next, then Expand, Full screen and Close. On a phone it opens full width with Back.
- Rows, not card grids. Space, not borders. A hairline under a row is the most a list gets.
- Short text. If a field needs more than its budget, the detail goes to an agent file.
- Light and dark themes, phone width with a 16 px gutter and no sideways scroll.
- In the artifact frame `#` links do not scroll, so every move is a click handler and page state. Nothing scrolls or takes focus on load.

## Each section

**Summary.** Title, the tagline, the headline, two or three short paragraphs, then 3 to 6 numbers. A good number is measured: what it is today and the target in the note. No counts of tickets here (the Plan has them), no dates, nothing that waits on the reader.

**Problems.** In the manner of Linear: one list, a row per problem with a severity mark, its title, its status and its area, filtered by area with quiet chips. The status is worked out from its tickets: Not started, Working (any ticket started), Completed (every ticket verified). A problem opens in the panel, with sections that expand and collapse, in this order: The problem. Why it is a problem. What we found (each line with its evidence underneath). The fix (summary, points, the visuals, what we will not do, how others do it). The outcome we want. The tickets that fix it. Write each so it stands alone.

**Visuals.** They come first in the fix, before any text. A prototype shows as a large live preview (rendered at 1280 px and scaled to the column, 390 px wide on a phone, not scrollable until opened) with an Open full screen button; full screen it has Close and Open in a new tab, so it can be scrolled and used. `Today` and `Proposed` images sit under it in two columns and open full screen in a lightbox. A caption need not repeat its label; the page strips a leading "Today:" or "Proposed:". A diagram is an image, usually SVG, at most about twelve boxes. Capture real screens; for a screen fix, apply it in a throwaway copy and capture the result.

**Tickets.** The same list and panel as Problems. A row shows a status dot, the title, chips for its wave and pull request, and its status from the db (Not started, Working, Built, Reviewed, Verified, Blocked). The list groups by wave (the default), by pull request or by problem. The panel shows: its status, the problem it fixes (a link that opens that problem), what the agent will do, how, the files it edits, what it depends on, its proof, its wave and pull request, and, once done, its evidence and commit.

**Plan.** The goal in a sentence. The counts strip. One line on why waves exist. Then the waves in order, down a numbered rail (the number turns green when every ticket in the wave is verified): the wave's `why` shown prominently, its `gives` ("When it is done: ..."), its tickets as compact rows that open the ticket panel, and, in one quiet block headed After this wave, the junctions (a code review, a critical review, a browser check, a merge), each with what it covers and who does it. Then the pull requests and How we prove it. While a run is live, one quiet line at the top shows its step, wave and note, and opens to the recent log.

**Proof.** A completion report. Until work lands it shows the planned total greyed (0 of 10 tickets verified) over an empty bar and one honest line. Then a headline (verified tickets out of planned, pull requests open and merged) with a thin bar, each pull request with its link and state, under it each ticket's evidence (a before and after image, test output or a measured number) with its commit, and a Not verified list at the end.

## Word budgets

| Field | Budget |
|---|---|
| tagline | 15 words |
| summary headline; each paragraph | 25; 70 words |
| a number's label; its note | 6; 14 words |
| problem title | 12 words |
| problem, why | 70 words each |
| a found line | 35 words |
| fix summary; each point or not doing line; reference | 60; 25; 40 words |
| visual caption; each outcome line | 25 words |
| plan goal | 30 words |
| ticket title; does; each how step; proof | 12; 60; 30; 35 words |
| wave title; why; gives; each junction | 8; 30; 25; 30 words |
| pull request title | 10 words |
| verification strategy; a check's what and pass | 80; 30 words each |

The build warns past each budget.

## Words

- The user's vocabulary, short sentences, verbs first in ticket titles.
- No em or en dashes, no internal codes or ids in human text, no time estimates.
- No hedging, no praise, no "leverage".
- Every claim about today's product has its evidence one line below it.

## Agent mode

Dense, in a monospace font: the file list (book.json, agent files, shots, prototypes, and the db collections status, run and log) and a raw viewer with Copy. It is for an agent or an engineer who wants the raw files.
