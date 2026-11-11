# Components

Every section is one claim and one component on the surface, then any number of depth rows under it. You write data; the template draws, animates and makes it accessible. `examples/sample-book/book.json` (a large plan, full required depth) and `examples/feature-book/book.json` (a small feature) between them use every component; copy the sections you need.

A section:

```json
{ "id": "architecture", "group": "how", "nav": "Architecture", "promise": "Every part and what it costs",
  "component": "map", "label": "How it works",
  "claim": "An export is saved as a job first, so a crash never loses it.",
  "lead": "Two workers share the work.", "source": "agent/DESIGN.md#2",
  "data": { }, "depth": [ { "id": "parts", "title": "Every part on the map", "kind": "table", "source": "agent/DESIGN.md#2.2", "data": { } } ] }
```

- `group`: one of `book.groups[].id` (`{ id, label }` in menu order). The side menu lists sections by group.
- `nav`: the menu label, 3 words. `promise`: 6 words under it in the story's "What is in this book". `nav: false` keeps a section out of the menu.
- `label`: the small grey line above the claim, 4 words.
- `claim`: a full sentence a stranger understands, 14 words (12 on the story). Never a label like "Architecture".
- `lead`: optional, 40 words (30 on the story). The one fact the claim needs. Never instructions.
- `source`: a published file (an `#anchor` is fine) or a URL. Shows as "Source: <the file's title>", and the file opens in place.
- `depth`: the second layer (below).
- Claims and leads may hold `{expression}` or `{expression|format}` filled from `book.model` (formats: `money`, `cents`, `int`, `dec`, `pct`, `word`, `times`).

Rules every component already follows: state changes take 150 ms, movement 600 to 900 ms, nothing loops but the live dot, every animated figure has Play, Pause, Back and Next, reduced motion jumps to end states, every control is a real button or input at least 28 px tall, a state is a dot and a word, each figure has a live text reading, and a figure is redrawn for a phone, never shrunk.

## The catalog

| Component | Use it for | `data` |
|---|---|---|
| `story` | The whole book on one screen. Always first, exactly once. Draws the status line and "What is in this book". | `numbers[3]`, `after`, `figure` |
| `compare` | Today against the plan, in the same frame. | `before`, `after`, `parts`, `start` |
| `map` | The parts and who talks to whom, with a flow player and a failure story. | `nodes`, `edges`, `stories` |
| `steps` | A short sequence a person goes through, stepped one at a time. | `steps` |
| `capabilities` | What it can do, each with a state. | `items`, `empty` |
| `inventory` | What exists today: built and proven, built, planned, later. | `columns` |
| `risks` | What can go wrong and what happens then, on a 3 by 3 grid. | `risks`, `likelihood`, `impact` |
| `scale` | The design holding from zero to the top of the range. | `input`, `inputs`, `rows`, `say`, `flags`, `calm` |
| `cost` | What it costs as use grows, against the alternative. | `x`, `controls`, `series`, `readouts`, `split`, `certainty`, `note` |
| `cards` | Six things side by side: top failures, ops groups, options. | `items` |
| `figure` | A still picture: steps with hours, a stacked bar, bars, a line over time, layers. | a figure (below) |
| `research` | One card per research question. | none: reads `book.research` |
| `decisions` | The count and the five that shape the most; depth lists all. | `top` |
| `plan` | The plan board: totals, the critical path, waves with pull request cards and ticket rows, review gates, the ticket drawer. | none: reads `plan` and the db |
| `verification` | Counters per test kind and the gate picture. | none: reads `plan` |
| `kickoff` | The steps, the Copy button and the ready list; depth holds the full prompt. | `steps` |
| `ops` | One card per group of what only the owner does. | none: reads `book.ops` |
| `progress` | Wave rings, pull request bars, the last log lines. | none: reads the db |
| `build` | The older step timeline with inline work cards. Use `plan` in a new book. | none |
| `roadmap` | What comes after, and the signal that starts each. | `items` |
| `decided` | The older decisions list. Use `decisions` in a new book. | none |
| `chapter` | A custom explorable figure no catalog component fits. | file `chapters/<id>.html` |

The status line, the decided line under each section, the one blocking card, the ticket drawer, the proof strip and the agent workspace are drawn by the template from the plan, `decided` and the db; they need no section.

## Depth rows

Each block in `depth` is one row that opens in place. "Expand all depth" opens them all; printing opens them all. Deep link: `#<section-id>/<block-id>`.

```json
{ "id": "parts", "title": "Every AWS part", "kind": "table", "role": "parts",
  "lead": "One optional sentence.", "source": { "path": "agent/DESIGN.md#2.2", "label": "Design, section 2.2" },
  "data": { "columns": ["Part", "Choice", "Does", "Why", "Cost a month", "Source"],
            "rows": [ ["Front door", "CloudFront and WAF", "Routes and filters", "Pay per request", "$6", "Price list, 11 Nov"],
                      { "cells": ["Workers", "Fargate ARM, 0 to N", "Run the agents", "Per second", "$0 idle", "Price list"], "detail": "Longer text shown when the row opens.", "node": "workers" } ] } }
```

| `kind` | `data` |
|---|---|
| `table` | `columns`, `rows` (an array of cells, or `{ cells, detail, node }`), `note`. A cell is text, a number, or `{ label, file }` (opens the file), `{ label, url }`, `{ label, ticket }` (opens the ticket). Tables sort by a column and filter past 12 rows |
| `text` | `paragraphs`, two at most |
| `list` | `items` (text or `{ label, text }`), `ordered` |
| `figure` | a figure: `{ type: "steps", items: [{ label, value, note }], unit, total }`, `{ type: "stack", items, unit, total_label }`, `{ type: "bars", items, unit }`, `{ type: "line", series: [{ name, points: [[x, y]] }], x_label, y_label }`, `{ type: "layers", items: [{ label, wall }] }` |
| `file` | `path` of a published file; shows it raw in place with Copy |
| `code` | `text`; a scroll box with Copy, for prompts, formulas and commands |

`title` says what is inside in 6 words; the page adds the size ("21 rows"). `source` is required. In depth, real names are wanted: services, packages, paths, ids beside their plain name.

**Automatic depth.** Some sections add rows from the book's own data, so do not write them again: `plan` (every pull request in order, the critical path, each wave with lanes and gate, principles, how it ships, build risks, stop rules), `verification` (coverage lines, final checks, ready checks, while building, each review with its checks, hard gates, gate rules), `kickoff` (the prompt in full, each other prompt), `decisions` (every decision, filter by section), `research` (every note with what it changed and sources, findings), `ops` (one table per group), `progress` (the log, the final report).

**Roles.** The checker finds required depth by `role` (on the block, or in `data` for a table): `out-of-scope`, `parts`, `open-source`, `scale-rule`, `scale-up`, `scale-down`, `limits`, `unit-prices` (columns Source and Read), `cost-formula`, `cost-example` (`data.result`, and `data.check`, the `book.model` expression whose value equals it), `cost-excluded`, `who-may-act`, `walls`, `secrets`, `accepted-risks`, `failures` (columns Lost and Back), `backups`. A parts row ties to a map part by `node` or by starting with the part's name.

### story

```json
"data": {
  "numbers": [
    { "value": "3 hours", "label": "saved per bookkeeper each month", "certainty": "estimated", "source": "agent/research/formats.md" },
    { "value": "Under 1 minute", "label": "for a month of 5,000 invoices", "certainty": "designed" },
    { "value": "0 of 0", "label": "pieces of work proven", "live": "proven", "certainty": "measured" } ],
  "figure": { "from": "how" },
  "after": { "claim": "Bookkeepers now get every invoice out in one click.", "lead": "What is built, proven and not proven yet." } }
```

Three numbers at most, each with a unit in `value` or `label` and a `certainty`: `measured` (we ran it), `estimated` (computed from stated prices or assumptions), `designed` (a target, not yet tested). `live: "proven"` makes a number count proven work from the db; in a preview with sample data its mark reads Sample, never Measured. `figure.from` names another section (best a `map`): on wide screens the story shows a small, still copy of that figure beside the claim, linked to the section, and hides it on a phone. `after` replaces claim and lead once `round.stage` is `report` or `done`; the story then lists `report.works_now` and `report.not_proven`.

### compare

```json
"data": { "start": "after",
  "before": { "label": "Today", "points": ["A bookkeeper opens each invoice and copies it"], "numbers": [ { "value": "3 hours", "label": "a month", "certainty": "estimated" } ] },
  "after":  { "label": "With export", "points": ["One button builds the whole month as one file"] },
  "parts": [ { "name": "Spreadsheet", "before": "Typed in by hand", "after": null },
             { "name": "Export job", "before": null, "after": "Builds the file in the background" } ] }
```

Three points a side, eight parts at most. A part with `null` on one side is absent there; parts that change get the accent outline.

### map

```json
"data": {
  "nodes": [ { "id": "queue", "name": "Job list", "does": "Exports not started", "wide": [336, 44, 136, 56], "tall": [104, 184, 150, 54] },
             { "id": "workers", "name": "Export workers", "zone": true, "wide": [500, 8, 156, 122], "tall": [92, 272, 174, 122] },
             { "id": "wa", "name": "Worker A", "dot": true, "wide": [512, 36, 132, 38], "tall": [104, 300, 150, 38] } ],
  "edges": [ { "id": "take", "from": "queue", "to": "workers", "verb": "hands out", "wide": "M472 72H500", "tall": "M179 238V272" } ],
  "stories": [ { "id": "normal", "name": "A normal export", "steps": [
      { "title": "A worker takes it", "text": "The job list hands the export to a free worker.", "edge": "take", "on": ["wa"], "busy": ["wa"] } ] },
    { "id": "crash", "name": "A worker stops", "steps": [ { "title": "Worker A stops", "text": "...", "dead": ["wa"] } ] } ] }
```

- 12 parts at most (zones do not count). `name` 2 words, `does` 4 words, plain names ("the waiting line"), never class, file or service names.
- `wide` and `tall` are `[x, y, width, height]` in SVG units. The figure picks `tall` when it is narrow. Give both. Leave 28 units of width beyond the longest label.
- `zone: true` draws a dashed group behind its members; `dot: true` draws a small worker row with a state word (idle, busy, down).
- `edges[].wide` and `.tall` are optional SVG paths; without them the template draws a right-angle path. Every edge has a `verb`.
- Up to three `stories` of up to seven steps: `title` 5 words, `text` 20 words, `edge` the arrow the dot travels (`reverse: true` to go back), `on` parts to outline, `busy` and `dead` worker rows. One story should be a failure.

### steps

```json
"data": { "steps": [ { "title": "Pick the tool", "text": "Xero, QuickBooks or a plain spreadsheet." } ] }
```

Seven steps at most, `title` 5 words, `text` 20 words.

### capabilities

```json
"data": { "items": [ { "name": "Files for Xero", "line": "Columns match the Xero sales import.", "state": "today", "ticket": "csv-xero" },
                    { "name": "A whole year at once", "line": "For the tax return.", "state": "later" } ] }
```

`state` is `today`, `building` or `later`. With `ticket`, the live status wins: proven reads "Exists today", building or in review reads "Being built", not started reads "Planned". A row with a ticket, `proof` lines or a `source` opens to its proof and a link to its work card. The filter offers only the states present; once the stage is `report` or `done` it opens on Exists today. `name` 6 words, `line` 15. `labels` renames the filter and state words: `{ "all", "today", "building", "planned", "later" }`, a word or two each. (An older `only: "today"` still works, but do not repeat a list in a second section.)

### risks

```json
"data": { "risks": [ { "name": "A worker stops halfway", "likelihood": 3, "impact": 1, "covered": "yes", "ticket": "export-resume",
                       "then": "Another worker goes on from the last finished page." } ] }
```

`likelihood` and `impact` are 1 to 3; `covered` is `yes`, `partly` or `no`. Axis words default to Rare, Possible, Likely and Small, Serious, Severe (override with `likelihood` and `impact` lists). The list shows names, all closed on load; a row or a dot opens one at a time. The state never claims proof before a test passes: `yes` reads "Planned cover" until its `ticket` is proven, then "Covered"; `partly` reads "Partly"; `no` reads "Not covered". `labels` renames them: `{ "planned", "covered", "partly", "no" }`.

### scale and cost: the shared model

Both read `book.model`, one set of assumptions for the whole book. Moving a control in one figure moves every figure that uses the same input.

```json
"model": {
  "inputs": [ { "id": "invoices", "label": "Invoices a month", "unit": "invoices a month", "stops": [0, 100, 1000, 10000, 100000], "default": 5000, "ticks": [0, 1000, 10000, 100000] },
              { "id": "exports", "label": "How often they export", "options": [ { "value": 1, "label": "Monthly" }, { "value": 4, "label": "Weekly" } ], "default": 4 } ],
  "values": { "batch": "invoices / exports", "workers": "invoices == 0 ? 0 : min(40, ceil(batch / 2500))", "ours": "12 + invoices / 2500 * 0.05", "vendor": "29 + invoices * 0.01" } }
```

An input has `stops` (a slider over those values), `options` (a segmented choice) or `min` and `max`. A value is an expression over inputs and earlier values: numbers, `+ - * / % ^`, comparisons, `&& || !`, `a ? b : c`, and `min max ceil floor round abs sqrt log10 pow clamp`. A value may instead name a function a chapter registers in `window.BOOKFN`.

`scale`:

```json
"data": { "input": "invoices", "inputs": ["exports"],
  "rows": [ { "name": "Workers", "does": "Each writes 2,500 invoices a minute.", "value": "workers", "unit": ["worker", "workers"], "kind": "cells", "cap": 40 },
            { "name": "Wait", "does": "Until the file is ready.", "value": "wait", "unit": "seconds", "kind": "bar", "max": 60 } ],
  "say": [ { "when": "invoices == 0", "text": "Nothing to export, so no worker runs." }, { "text": "{workers} workers share each export." } ],
  "flags": [ { "when": "batch > 20000", "text": "Past 20,000 invoices the file comes in parts.", "tone": "warn" } ],
  "calm": "Nothing changes by hand at this size." }
```

`kind` is `cells` (one square per unit, `cap` squares at most), `bar` (needs `max`), `sizes` (`labels`, value 1 to 3) or `number`. `unit` may be `[singular, plural]`. The first `say` whose `when` holds is the sentence; a `flag` marks a manual step past a size; `calm` shows when no flag holds. `certainty` (`measured`, `estimated`, `designed`) marks the figures.

`cost`:

```json
"data": { "x": { "input": "invoices" }, "controls": ["invoices", "exports"],
  "series": [ { "name": "A sync service", "value": "vendor" }, { "name": "Our export", "value": "ours", "ours": true } ],
  "readouts": [ { "label": "Saved each month", "value": "vendor - ours", "big": true } ],
  "rival": "A sync service",
  "split": { "label": "Where our cost goes", "parts": [ { "name": "Always on", "value": "12" }, { "name": "Workers", "value": "ours - 12" } ] },
  "certainty": "estimated", "note": "Prices read 10 Nov from each vendor's price page." }
```

When the `big` readout falls below zero it reads "<rival> is cheaper by $304" instead of a minus sign. `rival` defaults to the first line that is not `ours`; a readout may set its own `negative` label, or `false` to keep the minus sign. Money drops ".00" from whole dollars.

One to three series, one marked `ours`. Readouts default to the `money` format (`format` to change). A claim with `{shape}` states the true shape computed from the data ("a straight line", "faster than a straight line", "slower than a straight line"), and `{ratio|times}` how many times faster the other line grows; the checker warns when a claim says straight or exponential and the data disagrees. Under it, depth rows with roles `unit-prices` (each price, its source and the date it was read), `cost-formula`, `cost-example` (ends in the figure the explorer shows at the model's defaults; `data.check` names the model value so the checker can compare) and `cost-excluded`.

### build

The older timeline; a new book uses `plan`. No data. Reads `plan.waves` (`name` 2 words, `what` 8 words), `plan.tickets` and the db. One ring per step: the arc is the share proven, a tick when done, a dot and a word under it (Proven, Building now, Next, Later). Picking a step lists its work cards directly under the steps, with no second heading. An optional `plan.start` (about 50 words) shows above the steps as a "Start here" strip in human mode. A card opens to Goal, Waits for (by name), Done when (each with a dot from `status/<id>.checks`), the proof strip (`status/<id>.lines`, `.summary`, `.proof` images, the commit) and, in agent mode, id, step, pull request, branch, file, raw status. One card is open at a time; `#<ticket-id>` in the URL opens it. Until the run writes its first status record, counts stay hidden: the rings show the step number, rows show no "0 of 2 done" and the final checks line has no "0 passed". After that each card row shows how many of its done-when hold ("1 of 2 done"); an open card also lists the final checks that cover it, with "Passes when". Under the rings, one collapsed line, "How it is proven at the end: 5 final checks, 0 passed", opens every check of `plan.verification.checks` with its live result from `status/check-<id>`: Not run yet, Passed, Failed or Skipped.

### roadmap

```json
"data": { "items": [ { "name": "Direct sync", "trigger": "after 1,000 exports a month", "line": "Send invoices straight into the tool." } ] }
```

Five at most. `trigger` is the signal that starts it, never a date nobody committed to.

### decided

The older list; a new book uses `decisions`. No data. Lists `book.decided`, three shown and the rest behind "All decisions". Every other section shows one line for its records ("2 decisions shaped this"): it jumps here and marks them, or, with no decided section, opens them in place. A record is never shown twice on load.

### chapter

`chapters/<id>.html` (or the section's `file`): an HTML fragment with optional `<style>` and `<script>`. The script runs once as `function (root, api)`. Use the page's tokens and classes (`seg`, `btn`, `tbl`, `dot`, `cap`), and mount catalog components instead of drawing them again:

```js
api.mount(root.querySelector("[data-steps]"), "steps", { steps: [ { title: "Read the invoice", text: "One page at a time." } ] });
```

`api` holds `h` and `s` (element builders), `mount`, `model` (`get`, `set`, `scope`), `onModel`, `fill`, `fmt`, `expr`, `live` and `onLive` (db state), `pstate(ticketId)`, `openTicket`, `jump`, `calm()` (true under reduced motion). Optional `chapters/_kit.css` and `_kit.js` load first for shared helpers. The build refuses a coloured side border or side stripe, any request to the network (a stylesheet, font, script, image, `url()`, `fetch`, `import`), and a dash. A plain `<a href>` link is fine. The artifact's own content security policy is the real wall; the check catches mistakes early.

### inventory

```json
"data": { "columns": [ { "state": "proven", "label": "Built and proven", "items": [ { "name": "Export job record", "note": "One row per export", "source": "agent/proof/run-1.png" } ] },
                       { "state": "planned", "label": "Planned", "items": [ { "name": "PDF bundle" } ] } ] }
```

Two to four columns; `state` is `proven`, `built`, `planned` or `later`. Every proven item names its proof in `source`.

### cards

```json
"data": { "items": [ { "title": "A worker dies", "text": "Another takes the lease.", "facts": [ { "label": "Lost", "value": "nothing" }, { "label": "Back in", "value": "under 1 minute" } ], "source": "agent/DESIGN.md#3" } ] }
```

Six at most on a surface; the rest go in a depth table.

### plan

No data. A totals line (`plan.totals`, or counted), the critical path as numbered steps with a running total (`plan.critical_path`), then a switch: By wave (bands with hours, why, lanes and the gate; pull request cards with their tickets in commit order; the review gate under each wave), By pull request, All tickets (a sortable, filterable table). A ticket row opens the drawer with every field: state, wave, pull request, branch, hours, size, risk, model, problem, goal, done when with live checks, the full acceptance, how it is verified, final checks, proof, files, depends on and unblocks as links, reviewers, why, the notes file, and "Open in agent mode". `#plan/<ticket-id>` opens it.

### verification, kickoff, ops, progress

`verification` counts `plan.coverage_lines` by kind (passed of total; "unknown until run" before the build) and draws the gate as wave, fresh review, Fable review, gate, next wave. `kickoff` takes `steps` (four short ones), draws "Copy the kickoff prompt" and "Before you paste" from `plan.verification.ready` with live state. `ops` reads `book.ops.groups`. `progress` reads the db.

## Choosing

- A claim about parts and order: `map`. About a person's few actions: `steps`. About change: `compare`.
- A number that depends on an assumption: put the assumption in `model` and use `scale` or `cost`.
- A list of features: `capabilities`. What is real today: `inventory`.
- If no picture fits, use a table in depth. Agent mode is never the only home for something a person needs to understand or run the work.
