# Data model

One book per piece of work, for its whole life. Never start a second artifact for the same work; republish the same URL.

## Three layers

| Layer | What it holds | Who writes it | How an agent reads it |
|---|---|---|---|
| `book.json` | The content: sections, the plan, decisions, the report, and everything agent mode shows | The agent, then republish | Local file, or `Artifact read` with `path: "agent/book.json"` |
| `agent/**` files | The ask verbatim, research notes, the checkpoint, ticket notes, prompts, reviews, proof images | The agent, then republish | `Artifact read` with `path` |
| The db | Live state: `status`, `run`, `log` | The run only | `ArtifactData` |

Content changes need a republish. Live state never does.

## Working copy

`<repo>/docs/<book-id>/book/` (never staged):

```
book/
  book.json
  agent/
    ASK.md                  the person's words, every round, verbatim, newest first
    CHECKPOINT.md           the run ledger: what happened, rulings, next step
    research/<topic>.md     one file per question, opens with Recommendations
    tickets/<id>.md         notes for one piece of work
    rounds/round-<n>.json   the frozen book.json of a closed round
    prompts/<name>.md       kickoff, builder brief, reviewer brief
    reviews/<id>.md         findings and how each was answered
    proof/<id>-<n>.png      screenshots; images publish as files
  chapters/<section-id>.html  custom explorable sections (optional)
  proto/<name>.html         prototypes, each a full page (optional)
```

On a new machine: `Artifact read` the book, then `Artifact read` with `paths` for every `book.files` entry into a fresh `book/` folder.

## book.json

Human text is plain words for a stranger: no em or en dashes, no ids, codes, file names or references to earlier conversations (`design.md`). Every `id` is kebab-case.

```json
{
  "id": "invoice-export",
  "title": "Invoice export",
  "subtitle": "The plan",
  "kind": "Plan and architecture",
  "owner": { "name": "Maya", "role": "Founder" },
  "profile": "large",
  "updated": "2026-11-11T09:00:00Z",
  "round": { "n": 3, "title": "PDF bundles and the monthly send", "started": "2026-10-27", "stage": "build" },
  "links": [ { "label": "Branch", "value": "invoice-export-r3", "url": "" } ],
  "now": "The plan is being written.",
  "terms": ["Xero", "QuickBooks"],

  "sections": [ { "id": "story", "component": "story", "claim": "...", "lead": "...", "data": { "numbers": [] } } ],
  "model": { "inputs": [], "values": {} },
  "decided": [ { "id": "keep-30-days", "what": "Files are kept for 30 days", "who": "model", "when": "2026-10-27",
                 "why": "Long enough to download again, short enough to keep storage small.", "section": "risks", "source": "agent/research/storage.md" } ],
  "blocking": null,

  "plan": { "summary": "...", "heartbeat_minutes": 180, "waves": [], "tickets": [], "prs": [], "branches": {}, "verification": {} },
  "findings": [], "research": [], "kickoff": "...", "prompts": [], "report": { "ready": false, "works_now": [], "not_proven": [] },
  "history": [], "files": [ { "path": "agent/ASK.md", "title": "The ask, verbatim", "kind": "md" } ]
}
```

| Field | Mode | Notes |
|---|---|---|
| `id`, `title` (8 words), `subtitle` (4), `kind` | both | `kind` is the small line above the story's claim |
| `owner`, `links`, `updated` | agent | |
| `profile` | both | `feature`, `audit` or `large`; sets the word budget shown on load (450, 750, 1,200) and the section count the checker warns above (5, 6, 9) |
| `terms` | none | Allowed names: products, vendors and standards a reader must recognise ("Z360", "S3", "Node.js"). The id and code check never flags them. Each still gets a short explanation where it is first used |
| `round` | agent | `stage` is `explore`, `plan`, `build`, `verify`, `report` or `done`. `report` and `done` switch the story to its `after` state |
| `now` | human | The status line before any plan exists, one sentence |
| `sections` | human | Ordered. Rendered in that order and nothing else in human mode. One `story`, first. A section id may not be a ticket id or a page id (`choice`, `reference`, `main`, `digest`, `live`, `mark`, `nav`, `theme`, `skip`, `top`, or one starting `book-`, `ch-`, `h-`, `b-`). `components.md` |
| `model` | human | The shared assumptions every `scale` and `cost` figure reads. `components.md` |
| `decided` | both | What was decided, who (`model` or a person's name, required), when, why. `what` 10 words, `why` 25. `section` links it from that section |
| `blocking` | human | `null`, or the one choice a person must make (below) |
| `plan.waves` | human | `{ n, id, name (2 words), what (8 words), prs }`. The steps a person sees |
| `plan.tickets` | human | `{ id, title (10 words), goal (30), done_when[] (15 each), depends_on[], after_merge[], file, files[], risk, size }` |
| `plan.prs`, `.branches`, `.flow`, `.review_policy`, `.merge_checklist`, `.github`, `.stop_rules`, `.verification`, `.milestones` | agent | The shipping process (`planning.md`). The Process tab shows them |
| `findings`, `research` | agent | Evidence. A section links to one through `source` |
| `kickoff`, `prompts` | agent | With Copy buttons in the Process tab |
| `report` | both | `works_now` and `not_proven` show on the story when finished; the rest is agent mode (`report.md`) |
| `history`, `files` | agent | Rounds, and every published agent file |

Any human object may carry `source`: a published path or a URL. It shows as "Evidence" in human mode and as the path in agent mode.

### The one blocking choice

Normally `null`. Set it only when a choice blocks the work, only a person can make it, and they have not answered in chat (`method.md`). The status line then reads "One choice is waiting for you" and links to one card. `question`, `why`, two `options` and `default` (what happens until they answer) are required.

```json
"blocking": { "id": "which-month", "question": "Which real month should the final check export?",
  "why": "Only you know which month your bookkeeper will compare by hand.",
  "options": [ { "label": "October", "effect": "The last closed month. Ready now." }, { "label": "September", "effect": "Already checked by hand." } ],
  "default": "Until you answer, the build goes on with step 3 and holds only the final check." }
```

The run may write the same object to `run/blocking` instead, so it shows without a republish. Remove it, or set `resolved: true`, once answered.

### Removed fields

The checker refuses these in a book that has `sections` and warns in an old one (ticket `short` only warns):

| Removed | Instead |
|---|---|
| `needs` | The status line. One blocking choice in `blocking` |
| `decisions` (open questions with options) | Decide and record in `decided`; ask in chat |
| `glossary` | Define a term in the sentence that first uses it |
| `summary.points`, `layout` | The story section; sections render in order |
| Ticket `short` | One name, `title`, everywhere |

`summary`, `problem`, `outcomes`, `architecture` and `prototypes` are no longer drawn. Move what matters into sections; keep the rest in agent files.

## The db

New books declare `capabilities: { db: { rules: [...] } }` with:

| Path | read | write | Written by |
|---|---|---|---|
| `status` | view | admin | the run |
| `run` | view | admin | the run |
| `log` | view | admin | the run |

Nobody else writes. People answer in chat.

- `status/<ticket-id>`: `{ state, checks, lines, summary, proof, note, sha, at }`. `state` is `todo`, `doing`, `review`, `unverified`, `built`, `done` or `blocked`. `checks` is one boolean per `done_when`, in order. `lines` are up to four lines of real output for the proof strip, `summary` one line above them, `proof` image paths under `agent/proof/`.
- `status/pr-<id>`: `{ state, number, url, base, sha, checks, at }`; `state` is `planned`, `building`, `open`, `merged` or `blocked`.
- `status/ready-<id>`: `{ state, note, at }` for each `plan.verification.ready` item; `ok`, `missing` or `unknown`.
- `status/check-<id>`: `{ state, note, proof, at }` for each final check; `todo`, `pass`, `fail` or `skipped`. Only the lead writes `pass`.
- `run/current`: `{ wave, phase, note, at, branch, pr, sha }`. `phase` is `ready`, `building`, `review`, `fixing`, `final`, `paused` or `done`. `note` is the status line: one plain sentence, no ids.
- `run/blocking`: the one blocking choice, same shape as `book.blocking`. Delete it when answered.
- `log/<yyyymmddhhmmss>-<slug>`: append-only `{ at, round, kind, text, evidence }`. `kind` is `start`, `decision`, `review`, `fix`, `proof`, `open`, `drop`, `check`, `merge`, `blocked`, `note` or `done`.

No ticket id may start with `pr-`, `check-` or `ready-`.

A person sees four states, mapped from the finer ones:

| Person sees | From `status/<id>.state` |
|---|---|
| Waiting | `todo`, no document |
| Building | `doing` |
| In review | `review`, `unverified` |
| Proven | `built`, `done` |
| Stopped (with the reason) | `blocked` |

The status line warns "No update for 3 hours" when the run is active and the last write is older than `plan.heartbeat_minutes` (default 180).

## For agents reading the page

- `<script type="application/json" id="book-index">` in `index.html` holds one index: sections, steps with their tickets, every ticket (title, goal, step, pull request, branch, file, files, depends_on, done_when, after_merge, risk, size, status document), every PR, ready item, run, check (with expect and pass), decided record, finding, research note and published file. An agent that fetches the HTML parses it without rendering. The content itself is the `book-data` block (the same as `agent/book.json`); `book-build` holds build facts; `book-demo` is empty except in `preview.html`.
- Every element that stands for a ticket, step, risk or decision carries `data-id`. `#<ticket-id>` opens its card.
- Agent mode (`?mode=agent` or the switch) shows ids beside every name and the Reference section: Index (every ticket, check, ready item, decision, finding, research note and section), Files (every published file, raw), Raw (`book.json` and every db collection), Process (kickoff and prompts, the pull request plan, how it ships, verification, reviews), History (rounds, the log, report data), and Copy digest.
- Nothing exists only in human mode: every sentence a person sees comes from a field an agent can read.

## Moving an older book to this shape

An older book (no `sections`) builds only as a preview (`--preview`): the page shows a story and the build, everything else in agent mode. Without `--preview` the build refuses it. Do not republish an older book with this template until its sections are written. To migrate:

0. Before anything else, read `decisions`, `feedback` and `gates` with ArtifactData and save them to `agent/rounds/round-<n>-db.json`; add it to `files`. An answer in `decisions/<id>` becomes a `decided` record with that person's name and date. Each open feedback entry becomes an ask line in `agent/ASK.md`. (Agent mode, History, also shows these old documents while the db still has them.)
1. Freeze the old file as `agent/rounds/round-<n>.json` and add it to `files`.
2. Write `sections`: the story from `summary.headline`, `problem.statement` and three of `summary.numbers` (add certainty); a `compare` from `problem.today` and the outcomes; a `map` from the main `architecture` frame (12 parts at most) with one normal and one failure story; `capabilities` from `outcomes`; `risks` from `plan.risks`; `build` as is; `roadmap` from `plan.later`.
3. Turn every answered `decisions` entry into a `decided` record (the person who answered, the date, why). Take the recommendation for each unanswered one, record it as decided by the model, and tell the person in chat. Delete `decisions`, `needs`, `glossary`, `summary.points` and ticket `short`.
4. Give each wave a two-word `name` and an eight-word `what`; rewrite each ticket `title` as a plain outcome.
5. Build, fix every warning, republish with the same `file_path`. Existing db rules for `decisions`, `feedback` and `gates` stay declared but the page no longer reads them; old status documents keep working.

## Publishing

`node scripts/build.mjs <book-dir>` checks book.json, writes `index.html` and prints the `files` map: every `book.files` entry, every image under `agent/proof/`, every `proto/*.html` and every chapter. Publish with the Artifact tool: `file_path` the index.html, `files` the printed map, the db capability on the first publish only. Use the same `file_path` every time so the URL stays.

To look before publishing: `node scripts/build.mjs <book-dir> --demo <db-seed.json> --preview` writes `preview.html` with sample live state (labelled Sample, used only when the db is not reachable). `index.html` never carries sample state. Never publish `preview.html`. `examples/sample-book/db-seed.json` shows every document; a seed may write times as `now`, `now-5m`, `now-3h` or `now-2d`.
