# How a book reads

The reader opens the link cold. They have no context, they read about a fifth of the words, and they give it about three minutes. So: show the answer, let them play with it, and let them read only if they want more. Each section is one claim, one picture that moves, and at most 25 words. Everything else is one click deeper or in agent mode.

## The shape of a plan and architecture book

There is no fixed list of sections. A book has the story, then only the sections this work needs, each answering a question the reader has. The table is the usual order for a large plan, not a form. Typical sizes: feature 3 to 5 sections, audit 4 to 6, large 6 to 9 (the checker warns above 5, 6 and 9). Two ideas that share one picture share one section. No section repeats another. Cut a section before you shorten it. A title is always a claim a stranger understands ("A job is saved before any work starts"), never a label ("Architecture").

| # | Section | Holds | Component |
|---|---|---|---|
| 1 | The story | The headline claim, one sentence on today's pain and what we build, three numbers with a certainty mark, the status line | `story` |
| 2 | Why | The problem in one concrete case (a bill, a failure, a wait), what changes for whom, what we will not build | `compare` |
| 3 | How it works | The system as 5 to 12 named parts and one job moving through them, plus one failure story | `map`, `steps` |
| 4 | What it can do, and what exists today | Each capability as one line and a state: exists today, being built, planned, later. When the stage is `report` or `done` the list opens on Exists today | `capabilities` |
| 5 | Safety, recovery and cost | What can go wrong and what happens then; what it costs as use grows, with assumptions the reader can change | `risks`, `scale`, `cost` |
| 6 | The build | The steps in order with live status; each piece of work with its goal, done-when, proof and final check; the final checks with their results | `build` |
| 7 | Beyond | Three to five things that come next, each with the signal that starts it | `roadmap` |
| R | Reference | Every id, file, status, decision, finding, research note, kickoff, review and round | agent mode only |

This order answers an onboarding engineer's questions: what and why, how it is built, what it does and what works today, security, edge cases and cost, how we build the rest, what comes after. A feature book uses a subset (story, how it works, the build; see `examples/feature-book`). An audit book uses story, why (what we found, as before and after), risks, and the build if fixes follow.

Decisions appear once. Under a section only one line shows ("2 decisions shaped this"). Add a `decided` section at the end only when a person made at least one of the choices; the line then jumps there. Without one, the line opens the records in place.

## Page rules

- Section pattern: a small label, the claim as the heading, a lead of at most 25 words (30 on the story), then one component. No second paragraph on load.
- Top bar: book name, at most six anchors, the Human and Agent switch, the theme switch. Nothing else.
- No side list, no greyed or empty sections, no box around text, no coloured side borders. One hairline is the only divider. The build refuses a coloured side border and any network font, stylesheet or script.
- One shared set of assumptions per book (`book.model`). A control in one figure moves every figure that uses the same input.
- "Show the numbers" opens the table behind a figure. The table is never the first thing.
- A section appears when it has content. Progress, proof and the report are states of the same sections, not new ones.

## Writing

**Budgets.** The checker counts what you write plus what the page adds (state words, certainty marks, buttons, axis ticks, the status line, the small figure beside the story) as a wide screen shows it on load. Closed cards and screen reader text do not count, because nobody sees them. On both examples it matches the words in the page's visible text within 3%. Over budget, a claim, lead, piece of work title or step name is an error; the whole book over budget is an error, over 80% a warning.

| Element | Words |
|---|---|
| Book title | 8 |
| Story claim; section claim | 12; 14, one sentence, no colon |
| Lead | 25 (30 on the story), optional |
| Number label | 6 |
| Flow step title, text | 5, 20 |
| Map part name, line | 2, 4 |
| Capability name, line | 6, 15 |
| Risk name, what happens then | 6, 20 |
| Step name, what it gives | 2, 8 |
| Piece of work title, goal, each done-when | 10, 30, 15 |
| Decided what, why | 10, 25 |
| First screen | 80 |
| Shown on load, whole book, as the browser shows it | 450 feature, 750 audit, 1,200 large. Aim for less |

**Leads.** A lead states the one fact the claim needs, or is left out. Never instructions ("Drag the slider", "Pick a dot"): the template labels its own controls.

**Names.** Name a thing by what it does, in the reader's words: "the waiting line", "the front door", "workers start from zero and return to zero". Human text never holds a ticket id, a decision number, a wave or milestone code, a pull request number, a branch, a file path or a file name. Ids live in `id` fields and show in agent mode. Number steps by order ("Step 3 of 5"); a code ("W2", "D7") is not information. A product or vendor name is fine when the reader must recognise it, explained once ("Langfuse, the open-source tool that stores traces"). List such names in `book.terms` so the checker does not flag them.

**Terms.** Use the plain word when one exists. When a term is needed, the sentence that first uses it explains it in under ten words. No glossary. No abbreviation unless people say it aloud that way.

**No assumed context.** No "as discussed", "see above", "after your second brief", "the earlier plan". No sentence about the document itself.

**Numbers.** Every number has a unit and a period ("$187 a month", "41 seconds"). Every number carries one certainty mark: Measured (we ran it), Estimated (computed from stated prices or assumptions), Designed, not yet tested (a target). Round to what the certainty supports. State a shape honestly: a straight line is a straight line.

**Style.** Short sentences, one idea each. Verbs first in names of work. Sentence case. No em or en dashes, no hedging, no praise, no "we will leverage".

The checker warns on: a plan code (`W2`, `CP-3`), a numbered reference ("decision 130", "round 3"), a file path, file name (`export.csv`) or branch, a code name (`ExportJob`), any id of this book, a reference to context the reader may not have, a lead that gives instructions, a claim that reads as a label, a number without a unit ("costs 5"), and a story or compare number without a certainty mark. Names in `book.terms` are never flagged. It refuses a dash anywhere. Fix every warning before publishing. The checker cannot judge plain language: read the page as a stranger before publishing.

## Motion and access

- State changes 150 ms. Movement across a figure 600 to 900 ms, ease in and out. Entrances staggered, 360 ms in total at most. Nothing loops except the 7 px live dot. A figure may play once when it first scrolls into view, then stops.
- Reduced motion: no autoplay, no travelling dot, no stagger; figures jump to the end state of each step.
- Every control is a real button or input, 28 px tall at least. Colour never stands alone: a state is a dot and a word. Each figure has a text reading that updates. Visible focus. Everything works by keyboard.
- Phone: a figure is redrawn for the width (the map has a tall layout, the timeline turns vertical), never shrunk below 11.5 px text. No sideways page scroll. The section anchors stay, as one row that scrolls sideways, and a skip link to the build is the first thing Tab reaches.
- Colour: the template's tokens only, light and dark. One accent for the thing to look at now; greys for other series; green, amber and red only in small dots.
- 3D only for physical objects. A software system is a graph; draw it flat.

## Live progress without clutter

- One status line on the story is the only place that says what is happening now: "Files, step 2 of 4, is being built. Next: PDFs." It reads `run/current.note` when set. In a preview it says "Sample data" and the live number reads Sample, never Measured.
- One place for detail: the build. A ring fills as pieces are proven; the piece being built carries the accent dot.
- Four states for a person: Waiting, Building, In review, Proven, plus Stopped with its reason. Finer states are agent mode.
- A change while the page is open animates its ring once and the line reads "Updated just now". No toasts, feeds or badge counts.
- When the last write is older than the run's heartbeat, the line reads "No update for 3 hours" with an amber dot, so the page never shows stale green.

## Human mode and agent mode

| | Human mode | Agent mode |
|---|---|---|
| For | Understand and trust in three minutes | Find anything, resume the work |
| Shows | The sections, pictures first, names only | The same page with ids beside every name, plus the Reference section |
| Words | Budgeted | Unbounded, dense |
| Status | Status line, rings, a dot and a word | Raw db documents with times |

Nothing exists only in human mode. Every sentence a person sees comes from a field an agent can read.
