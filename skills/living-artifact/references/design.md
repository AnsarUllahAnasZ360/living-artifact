# How a book reads

The reader opens the link cold, with no context. Give them two layers on one page, plus a third for agents:

- **Surface.** Each section opens as one screen: a claim as the heading, a lead of at most 40 words, one visual. A stranger who scrolls only the surfaces gets the whole story in about five minutes.
- **Depth.** Under each visual, labelled rows that open in place: "Every AWS part (21 rows)", "The scaling rule", "Cost, step by step". Tables first, short paragraphs, real names. A section has as many depth rows as its subject needs.
- **Agent.** A separate, dense, monochrome workspace: the file tree, every table with every field, the raw files and the live database. Never the only home for something a person needs to understand or run the work.

Short on the surface, full depth one click away. No walls of text, and nothing important missing.

## The shape of a plan book

Sections sit in groups in a side menu. The table is the usual set for a large plan; use only what the work needs, and never say one thing in two sections. A heading is a claim a stranger understands ("A job is saved before any work starts"), never a label ("Architecture"); the menu carries the short label (`nav`).

| Group | Section | Surface | Depth (examples) | Component |
|---|---|---|---|---|
| Understand | Start | Claim, lead, three numbers, status line, "What is in this book" | none | `story` |
| | Why | Before and after, the measured bill | The bill line by line, what a run needs, the thesis | `compare` |
| | What it does | Capabilities with a state | Full coverage, definition of complete, out of scope | `capabilities` |
| | What exists today | Built and proven, built, planned | Proof for each item, what was removed | `inventory` |
| How it works | Architecture | System map with real names, a normal and a failure story | Every part (part, choice, does, why, cost, source), open source with licences, our own code, deployment shapes | `map` |
| | How a run works | Flow or steps | Request and run path, ownership, deploys and rollback | `map`, `steps` |
| | Scaling up and down | Scale slider, a 24 hour chart | The rule and formula, worked cases, scale to zero, limits, what breaks first | `scale`, `figure` |
| | Cost | Cost explorer, the idle month as a stacked bar | Unit prices with source and date, the formula, one worked example, tiers, what is excluded | `cost` |
| | Security | Risk grid or a layer picture | Who may act, the walls path by path, quotas, secrets, accepted risks | `risks`, `figure` |
| Proof and choices | Edge cases and failures | Top failures as cards | Every failure with what is lost and time back, data lifecycle, backups | `cards` |
| | Research | One card per question | Every note with answer, what it changed, sources and the file; findings | `research` |
| | Decisions | Count and the five that shape the most | All, with who, when, why, filter by section | `decisions` |
| The build | The plan | Totals, critical path, waves with pull request cards and ticket rows | Pull requests, critical path, each wave, principles, how it ships, risks, stop rules | `plan` |
| | Verification | Counters per test kind, the gate picture | Coverage lines, final checks, ready checks, each review, hard gates, gate rules | `verification` |
| | Kickoff | Four steps, Copy the kickoff prompt, Before you paste | The prompt in full, other prompts | `kickoff` |
| | Ops checklist | One card per group | Every item: what, when, if skipped | `ops` |
| | Progress | Wave rings, pull request bars, last log lines | Full log, final report | `progress` |
| After | Beyond | Roadmap rail | Stages, go and stop tests | `roadmap` |

A feature book uses a few: the story, how it works, scope, decisions, the plan, verification and kickoff (`examples/feature-book`). An audit book uses the story, why, risks, research, and the plan if fixes follow.

Decisions appear once. Under a section one line shows ("2 decisions shaped this") and jumps to the decisions section.

## Page rules

- Header, one row that never wraps or clips: the menu button below 1024 px, the title and subtitle, one status phrase ("Plan ready, build not started"), the Human and Agent switch, a Links menu, the theme. Only the subtitle may shorten.
- From 1024 px a sticky side menu lists every section by group, with a find box, "Expand all depth", a state dot on live sections and the current section's depth rows as children. Below 1024 px the same menu is a drawer. No horizontal menu strip anywhere.
- Section pattern: a small label, the claim, the lead, one component, then the depth rows. The surface fits 900 px of height at 1280 px (the plan board and chapters excepted).
- Every depth row says what is inside and its size, and shows its source as "Source: <what opens>"; a file opens in place.
- Deep links: `#<section>`, `#<section>/<block>`, `#plan/<ticket-id>`, `#agent/<path>`, `?mode=agent`.
- No coloured side borders, no box around text, one hairline as the divider. The build refuses a coloured side border and any network font, stylesheet or script.
- One shared set of assumptions per book (`book.model`). A control in one figure moves every figure that uses the same input.
- A section appears when it has content. Progress, proof and the report are states of the same sections.

## Writing

**Each element by itself.** The checker counts every element on its own and fails the build when one is over. The page as a whole has no word limit; the number of depth rows follows the subject.

| Element | Words |
|---|---|
| Book title; menu label | 8; 3 |
| Story claim; section claim | 12; 14, one sentence, no colon |
| Story lead; section lead | 30; 40 |
| Depth row title | 6, says what is inside (the page adds the size) |
| Depth row lead | 25 |
| Paragraph | 60, two in a row at most, then a table, list or figure |
| Table cell; row detail | 25; 120 |
| List item | 20 |
| Number label | 6 |
| Flow step title, text | 5, 20 |
| Map part name, line | 2, 4 |
| Capability name, line | 6, 15 |
| Risk name, what happens then | 6, 20 |
| Ticket title, goal, each done-when, problem | 10, 30, 15, 60. The full acceptance has no limit and sits under the plain lines |
| Decided what, why | 10, 25 |
| First screen | 80, plus the story numbers |

**Leads.** A lead states the one fact the claim needs, or is left out. Never instructions ("Drag the slider").

**Names.** On the surface, name a thing by what it does, in the reader's words: "the waiting line", "the front door". No bare codes: no ticket id, decision number, wave code, branch or file name on the surface. In depth and in ticket detail, real names are wanted: service and package names, file paths, branch names, ids beside their plain name ("Aurora with no standby, `aurora-database`"). Forbidden everywhere in human mode: a code alone ("see decision 177", "W2"). List product and vendor names in `book.terms`.

**Terms.** Explain a term in the sentence that first uses it. An optional `words` list (20 terms at most) sits at the end.

**No assumed context.** No "as discussed", "see above", "the earlier plan". No sentence about the document itself.

**Numbers.** A unit and a period ("$187 a month"), and one certainty mark: Measured, Estimated, or Designed, not yet tested. A cost on a surface has its unit prices, each with a source and a read date, and a worked example that ends in the same figure.

**Style.** Short sentences, one idea each. Sentence case. No em or en dashes, no hedging, no praise.

## What the build checks

`node scripts/build.mjs <book>` fails (exit 1) when:

- an element is over its word limit, or a dash appears anywhere;
- a required item below is missing for a large plan book (`profile: "large"` with tickets);
- a ticket lacks goal, files, depends_on, done_when or verify (a large book also size and risk);
- a map part has no row in the parts table, or a price row has no source or read date;
- a `source` or file points at a file that is not published;
- a level 2 heading of `agent/DESIGN.md` has no section or depth row (a `source` anchor) and is not in `book.unmapped`;
- a section, depth row or ticket field of the previous round (`agent/rounds/round-<n>.json`) is gone and not in `book.removed` with a reason and who asked;
- the rendered checks fail (`scripts/check-render.mjs`, headless Chromium at 1440, 1280, 1024, 768 and 390 px, both modes): the header clips or wraps, the page scrolls sideways, a menu link is cut off, the human page lacks a ticket title, the full kickoff, a decision, a research file name or a row of a depth table, agent mode shows the human page or is not monospace, `tables/tickets` lacks a row or a field, a surface is taller than 900 px at 1280, the console shows an error, or the page requests the network. `--no-render` skips them, and the page is then unchecked.

It prints a "Required depth" table: read it before publishing.

**Required depth for a large plan book.** Each line names what the checker looks for (`references/components.md`, "Roles").

1. Why: a measured number with its source.
2. What exists today: an `inventory` with items in every column, each proven item with proof.
3. Capabilities, and a depth row with role `out-of-scope`.
4. Architecture: a map, a `parts` table with one row per map part (columns Choice, Does, Why, Cost, Source), an `open-source` table with a Licence column.
5. A run's lifecycle with a failure story.
6. Scaling: rows with roles `scale-rule`, `scale-up`, `scale-down`, `limits`.
7. Cost: `unit-prices` (Source and Read columns, both filled), `cost-formula`, `cost-example` (its `result` equals the model's figure), `cost-excluded`.
8. Security: `who-may-act`, `walls`, `secrets`, `accepted-risks`.
9. Failures: a `failures` table (Lost and Back columns) and `backups`.
10. Research: every research file listed with question, answer and link.
11. Decisions: a `decisions` section; every record with who, when, why.
12. Plan: a `plan` section, waves, pull requests, `critical_path`, full tickets.
13. Verification: a `verification` section, `coverage_lines`, final checks, `reviews`.
14. Kickoff: a `kickoff` section and the full prompt.
15. Ops checklist (`book.ops`), when the work has one.
16. Beyond: a `roadmap`.
17. Agent workspace: automatic.

A feature or audit book needs 3, 11 to 14 and 17, plus 5 and 7 where it has a map or a cost.

**Loss review.** Before a book that replaces another is published, a fresh reviewer opens both at 1280 and 390 px, lists every section, table and view of the old one, and marks each yes, weaker or gone. Any "gone" needs the owner's words asking for it.

## Motion and access

- State changes 150 ms. Movement across a figure 600 to 900 ms. Nothing loops except the 7 px live dot.
- Reduced motion: no autoplay, no travelling dot; figures jump to the end state of each step.
- Every control is a real button, input or `details` row, 28 px tall at least. A state is a dot and a word. Visible focus. Everything works by keyboard; Escape closes the drawer and the ticket.
- Phone: a figure is redrawn for the width, never shrunk below 11.5 px text. No sideways page scroll.
- Print: every depth row opens.
- Colour: the template's tokens only, light and dark.

## Live progress without clutter

- The story's status line and the header's status phrase say what is happening now. In a preview they say "Sample data".
- Four states for a person: Waiting, Building, In review, Proven, plus Stopped with its reason.
- When the last write is older than the run's heartbeat, the line reads "No update for 3 hours".

## Human mode and agent mode

| | Human mode | Agent mode |
|---|---|---|
| For | Understand the work, then go as deep as needed | Find anything by id, resume the work |
| Looks | Inter, the accent colour, pictures first | One monospace font, black on white (white on black in dark), no colour except state words, dense rows |
| Layout | Side menu, sections, depth rows, ticket drawer | File tree on the left, one view on the right |
| Holds | Every section, every depth row, every ticket with all fields, the kickoff | `START` (kickoff, read order, stop rules), `tables/` (tickets with every field, pull requests, waves, critical path, reviews, coverage, checks, decided, findings, research, sections), `views/rules`, `views/digest`, `book.json`, every published file by folder, `db/` with counts, live or offline |

The first line of the agent view is always `START HERE: <file>` with Copy, then stage, wave, updated, round and whether the database is live. A ticket row opens its full record. Every ticket and research card in human mode has "Open in agent mode".
