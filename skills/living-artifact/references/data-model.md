# Data model: book.json version 2

One book per piece of work, for its whole life. Never start a second artifact for the same work; republish the same URL.

## Three layers

| Layer | What it is | Who writes it | How the agent reads it |
|---|---|---|---|
| `book.json` | The content: summary, problems, plan, proof | The orchestrator, then republish | Local file, or `Artifact read` with `path: "agent/book.json"` |
| `agent/**`, `shots/**`, `proto/**` | Raw files: the ask, research, checkpoint, kickoff, earlier rounds, proof images; screenshots; prototypes | The orchestrator, then republish | `Artifact read` with `path` |
| The db | Live state: `status`, `run`, `log` | The run | `ArtifactData` |

Content changes need a republish. Live state never does.

## Local working copy

`<repo>/docs/<book-id>/book/` (never staged):

```
book/
  book.json
  agent/
    ASK.md                 the user's words, every round, verbatim, newest first
    CHECKPOINT.md          the run ledger: where it stands, answers from the user, what is still open, next step
    research/<topic>.md    one file per question, opens with its recommendation
    prompts/kickoff.md     the kickoff prompt
    rounds/round-<n>.json  the frozen book.json of a closed round
    proof/<ticket>-<n>.png evidence images
  shots/<name>.png         Today and Proposed screenshots, diagrams
  proto/<name>.html        prototypes, each a full page
```

The build publishes every file under `agent/`, `shots/` and `proto/`. On a new machine: `Artifact read` the book, then `Artifact read` with `paths` for the published files into a fresh `book/` folder.

## book.json

All human text is plain words, no em or en dashes, no time estimates. Every `id` is kebab-case. Paths are relative to the book folder.

```json
{
  "version": 2,
  "id": "invoice-export",
  "title": "Invoice Export",
  "tagline": "One line, at most 15 words.",
  "owner": { "name": "Maya Okafor", "role": "Founder" },
  "updated": "2026-11-14T18:30:00Z",
  "stage": "plan",
  "links": [ { "label": "Data foundations pull request", "url": "https://..." } ],

  "summary": {
    "headline": "One sentence a stranger understands.",
    "paragraphs": ["Two or three short paragraphs."],
    "kpis": [ { "label": "Month end copying", "value": "3 h", "note": "Per bookkeeper today. Target: under 5 minutes." } ]
  },

  "problems": [
    {
      "id": "copy-by-hand", "title": "Bookkeepers copy every invoice by hand", "area": "Export", "severity": "high",
      "asked": "Optional: the user's own words about it.",
      "problem": "What is wrong, in his terms.",
      "why": "Why it matters: who it hurts and how much.",
      "found": [ { "text": "41 support tickets asked for an export.", "evidence": "a file:line, a URL, shots/x.png, a number, or his words" } ],
      "solution": {
        "summary": "The right way, in two or three sentences.",
        "points": ["One line each"],
        "not_doing": ["What we will not do, and why"],
        "reference": "How a named product does it."
      },
      "visuals": [
        { "label": "Today", "kind": "shot", "src": "shots/today.png", "caption": "One line" },
        { "label": "Proposed", "kind": "proto", "src": "proto/dialog.html", "caption": "One line" },
        { "label": "Diagram", "kind": "diagram", "src": "shots/flow.svg", "caption": "One line" }
      ],
      "outcome": ["What is true when it is fixed, one line each"]
    }
  ],

  "plan": {
    "goal": "One sentence.",
    "tickets": [
      {
        "id": "csv-presets", "title": "Write CSVs for the three tools", "problem": "copy-by-hand", "also_serves": ["month-ends-drift"],
        "does": "What the agent will do.",
        "how": ["Step", "Step"],
        "files": ["apps/api/src/export/csv.ts"],
        "depends_on": ["range-in-account-zone"],
        "wave": "files", "pr": "csv-export",
        "proof": { "kind": "test", "text": "How this ticket is proven." }
      }
    ],
    "waves": [
      { "id": "files", "title": "The files", "why": "Optional: what this wave does for him.", "gives": "Optional: what he has when it is done, one sentence.", "tickets": ["csv-presets"],
        "then": [ { "kind": "code-review", "by": "Fable", "what": "What it covers." } ] }
    ],
    "prs": [ { "id": "csv-export", "title": "CSV presets and the Export dialog", "branch": "export/csv", "base": "main", "tickets": ["csv-presets"] } ],
    "verification": {
      "strategy": "A few sentences: how the work is proven.",
      "checks": [ { "id": "csv-imports", "kind": "test", "by": "Opus", "what": "What is done.", "pass": "What counts as passing.", "tickets": ["csv-presets"] } ]
    }
  },

  "proof": {
    "prs": [ { "id": "csv-export", "url": "https://...", "state": "open" } ],
    "items": [ { "ticket": "csv-presets", "result": "What was shown.", "evidence": { "kind": "image", "src": "agent/proof/csv-1.png", "before": "agent/proof/csv-0.png", "text": "caption" }, "commit": "9b03f11c42" } ],
    "not_verified": ["What has no proof, said plainly"]
  }
}
```

Field notes:

- `stage`: `plan`, `build`, `verify` or `done`. `plan` is required from `build` on.
- `summary` holds only `headline`, `paragraphs` (two or three) and `kpis` (3 to 6, real numbers with a note such as today and the target).
- `severity`: `high`, `medium` or `low`. `area` is the filter on the Problems list. A problem's status is never typed: the page works it out from its tickets (Not started, Working, Completed).
- `visuals[].label`: `Today`, `Proposed` or `Diagram`; `kind`: `shot` (an image, opens in a lightbox), `proto` (an HTML page under `proto/` or a URL, opens full screen with Close and Open in a new tab) or `diagram` (an image, usually SVG). Every `src` inside the book must be under `shots/`, `proto/` or `agent/`.
- A ticket's `problem` names its main problem. `also_serves` (optional) lists other problem ids the same commit fixes: those problems list the ticket under The tickets that fix it and count it in their status, the ticket panel shows them under Fixes after the main one, and grouping by problem lists the ticket under its main problem only, with a +N hint. The build refuses an unknown id and warns when a problem has no ticket at all. `files` names every file it edits. `wave` and `pr` name a wave and a pull request, and the wave and pull request list it back. `proof.kind` is `test`, `browser` or `measure`.
- `waves` are in run order. `why` (optional) says what the wave does for him and shows prominently on the Plan; `gives` (optional) is one sentence: what he has when the wave is done. `then` lists the junctions after the wave: `kind` is `code-review`, `critical-review`, `browser-check` or `merge`; `by` is `Fable`, `Opus` or `Founder`. Fable never does a browser check.
- `verification.checks[].kind` is `browser`, `test`, `measure` or `review`; `by` names who runs it. Fable never runs a browser check.
- `proof.views` (optional) shows the finished result itself first, under See it: `[{ "label": "The new site", "kind": "proto", "src": "proto/site/index.html", "caption": "One line" }]`. `kind` is `proto` (a saved copy of a page, or a page holding a recording; opens full screen) or `shot` (an image). Use it when he asks to open or watch the result. A run that cannot rebuild the page can still fill it: list the views at plan time on fixed paths with a placeholder page, then publish the real files to the same paths.
- `proof.items[].evidence.kind` is `image` (`src`, optional `before` for a before and after pair, optional `text` caption), `text` (test output in `text`) or `number` (a measured number in `text`). `commit` is the commit the evidence saw.

Removed in version 2, refused by the build: `needs`, `decisions`, `kickoff`, `prompts`, `history`, `round`, `profile`, `outcomes`, `problem`, `findings`, `research`, `architecture`, `prototypes`, `report`, `files`, and any `estimate`, `eta`, `due`, `when`, `timeline` or `deadline` key.

## What the build computes

`build.mjs` never trusts typed counts. It computes tickets, waves, pull requests, commits (one per ticket), code reviews (`code-review` and `critical-review` junctions) and browser checks (`browser-check` junctions) and embeds them for the Plan tab. It refuses: a ticket without a known problem, files or proof; a dependency that is not in an earlier wave; two tickets in one wave that edit the same file; a ticket in no pull request or in two; a wave or pull request that does not list its tickets back; a Fable browser check; a removed section; a dash; a visual or evidence file that is not published. It warns when a ticket could run in an earlier wave, when there are fewer code reviews than pull requests, on time words in the plan, and on word budgets (`design.md`).

## The db

Declare `capabilities: { db: { rules: [...] } }` on the first publish only, with these rules (load the `artifact-capabilities` skill for the exact rule syntax):

| Path | read | write | Written by |
|---|---|---|---|
| `status` | view | admin | the run |
| `run` | view | admin | the run |
| `log` | view | admin | the run |

People only read the page; nothing on it writes. The page reads the three collections with `window.claude.use("db")` and `collection(...).onSnapshot`.

Documents:

- `status/<ticket-id>`: `{ state, note, proof: ["agent/proof/x-1.png"], sha, at }`. `state` is `todo`, `building`, `built` (committed, its own proof passed), `reviewed` (its pull request passed the Fable review), `verified` (its check passed and the evidence is tied to a commit) or `blocked` (with the reason in `note`).
- `status/pr-<pr-id>`: `{ state, number, url, base, sha, checks, at }`. `state` is `planned`, `building`, `open`, `merged` or `blocked`; `checks` is `passing`, `pending` or `failing`. The Proof tab reads it when `proof.prs` leaves the link or state out.
- No ticket id may start with `pr-` or `run-`.
- `run/current`: `{ wave, phase, note, at, branch, pr, sha }`. `wave` is the wave number (1 based); `phase` is `ready`, `building`, `review`, `fixing`, `final`, `paused` or `done`.
- `log/<yyyymmddhhmmss>-<slug>`: append only `{ at, kind, text, evidence }`. `kind` is `start`, `review`, `fix`, `proof`, `open`, `drop`, `check`, `merge`, `blocked`, `note` or `done`. Never edit a row; a correction is a new row.

## Publishing

`node scripts/build.mjs <book-dir>` checks book.json, writes `<book-dir>/index.html`, and prints the `files` map: `agent/book.json` plus every file under `agent/`, `shots/` and `proto/`. Publish with the Artifact tool: `file_path` the index.html, `files` the printed map, the db capability on the first publish only. Same `file_path` every time so the URL stays.

To see live status before a real run, `node scripts/build.mjs <book-dir> --demo <db-seed.json>` embeds sample live state, labelled as sample and shown only when the db is not available. `examples/sample-book/db-seed.json` shows every collection.
