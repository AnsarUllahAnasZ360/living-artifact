# living-artifact

A Claude Code skill for long-running work. Every piece of work, from a small feature to an audit to a multi-week build, runs through **one living HTML page** called the book. The book is the proposal, the plan, the live tracker and the final report, short on the surface and with full depth one click away. Any agent in any session can pick the work up from the book's link alone.

## Install

In Claude Code:

```
/plugin marketplace add AnsarUllahAnasZ360/living-artifact
/plugin install living-artifact@living-artifact
```

Or from a terminal:

```bash
claude plugin marketplace add AnsarUllahAnasZ360/living-artifact
```

```bash
claude plugin install living-artifact@living-artifact
```

Or copy the skill by hand:

```bash
git clone https://github.com/AnsarUllahAnasZ360/living-artifact && cp -R living-artifact/skills/living-artifact ~/.claude/skills/
```

To update the plugin later: `/plugin marketplace update living-artifact`.

**Needs:** Claude Code signed in with a claude.ai account that can publish Artifacts (the Artifact and ArtifactData tools), and Node 18 or newer for the build script.

## Use it

Ask in your own words. The skill starts when you bring a problem to explore, ask for a plan or a proposal, paste a kickoff, give feedback on a book, or ask for a report. For example:

- "Plan the new export flow with the living-artifact skill."
- "Audit our onboarding and write up what to fix."
- "Here is my feedback on the book, start the next round."
- "Run the build from this book: <link>."

## What a reader sees

A book is written for someone who opens the link with no context. A side menu lists every section in groups. Each section opens as one screen: one claim in plain words, a short lead and one picture. Under it, labelled rows open the depth in place: "Every part on the map (21 rows)", "The scaling rule", "Cost, step by step", each with a link to its source file. "Expand all depth" opens everything, and printing does too. A large plan usually has:

1. **Understand**: the story (claim, three numbers marked measured, estimated or designed, a live status line, what is in the book), why, what it does, what exists today.
2. **How it works**: the architecture as a map with every part in a table (choice, job, reason, cost, source) and open source with licences; how a run works with a failure story; scaling up and down; the cost explorer with unit prices, the formula and a worked example; security.
3. **Proof and choices**: failures and backups, research with every note, every decision with who, when and why.
4. **The build**: the plan board (waves with hours, pull request cards, ticket rows, the critical path, review gates; a ticket opens a drawer with every field), verification (coverage, final checks, reviews), the kickoff prompt with a Copy button, the ops checklist, live progress.
5. **After**: what comes next and the signal that starts each.

No questions panel and no bare codes on the surface. The agent decides what it can, records each decision, and asks you in the chat only when a choice is truly yours.

**Agent mode** is a separate black and white workspace: a file tree with `START` (the kickoff and read order), tables with every field (tickets, pull requests, waves, critical path, reviews, coverage, checks, decisions, findings, research, sections), plain text views, `book.json`, every published file and the live database. A machine-readable index sits in the page so an agent can read it without rendering it.

## How the work runs

```
frame -> explore <-> feedback -> plan <-> feedback -> run -> verify -> report -> next round
```

1. **Frame.** Your words go verbatim into `agent/ASK.md`; the agent writes the story.
2. **Explore.** It reads the code, runs research agents, records findings with evidence, and turns what it learned into sections.
3. **Plan.** Goal-sized pieces of work in steps that can run in parallel, one pull request per problem category, and a small checklist that proves every piece.
4. **Run.** A kickoff prompt starts a fresh session. Each piece is built, proven on the local stack and reviewed before its commit is final; each pull request is reviewed whole before it opens. Status is written to the page as it happens.
5. **Verify.** The agreed checklist runs once on a fresh copy holding every pull request.
6. **Report.** The same page switches to what works now and what is not proven, with proof on every card.

## Files

```
.claude-plugin/
  plugin.json          the plugin
  marketplace.json     lets /plugin marketplace add find it
skills/living-artifact/
  SKILL.md             the loop and the rules every stage follows
  references/
    method.md          the stages, and when to ask a person
    design.md          the shape of a book, writing rules, motion and access
    components.md      the component catalog and the data each takes
    data-model.md      book.json, agent files, the live database, moving an older book
    planning.md        tickets, steps, pull requests, verification
    run.md             running the build, with the wave workflows
    report.md          the report, the PR body, the retro
    kickoff.md         the kickoff and progress prompts
  scripts/build.mjs    checks book.json, builds the page and runs the rendered checks
  scripts/check-render.mjs  the rendered checks in headless Chromium
  assets/book.html     the page template
  assets/fonts/        Inter and JetBrains Mono, embedded in every page (SIL Open Font License, OFL.txt)
  examples/feature-book a small feature book, no pull requests
  examples/sample-book a large plan with every required depth item and sample live data
  research/            the sources the skill is built on
```

| Layer | What it holds | How it changes |
| --- | --- | --- |
| `book.json` | Sections, the shared assumptions, decisions, the plan, the report, and everything agent mode shows | The agent edits it and republishes the same page |
| `agent/` files | The verbatim ask, the checkpoint, research notes, ticket notes, earlier rounds, proof images | Published next to the page |
| Live database | Status of each piece of work, the run state, the log | Written by the run as work happens |

## The build script

```bash
node skills/living-artifact/scripts/build.mjs <book-dir> [--demo seed.json] [--preview] [--no-render]
```

It refuses a broken plan, a ticket without goal, files, dependencies, done-when or how it is verified, any element over its own word limit, a dash, a source that is not published, a coloured side border and any request to the network. For a large plan it also refuses a book missing required depth (architecture parts, cost math, scaling, security, failures, research, decisions, the plan, verification, kickoff and more) and prints a table of each item, present or missing. When the book has a design file, every heading must map to a section; when an earlier round is frozen, nothing it had may disappear without a reason. Then it opens the page in headless Chromium at 1440, 1280, 1024, 768 and 390 px in both modes (Playwright needed; `--no-render` skips it) and fails on a clipped header, sideways scroll, a cut-off menu, missing content, a console error or a network request. It writes `index.html` and prints the files map to publish. `--demo` sample state goes only into `preview.html`, labelled Sample; `index.html` never carries it.

Try it on the sample:

```bash
node skills/living-artifact/scripts/build.mjs skills/living-artifact/examples/sample-book --demo skills/living-artifact/examples/sample-book/db-seed.json --preview
```

Then open `skills/living-artifact/examples/sample-book/preview.html`. The same works for `examples/feature-book`.

## Profiles

- **feature**: one step, one agent, one review. Hours.
- **audit**: findings and fixes with evidence; a build only if fixes follow.
- **large**: several steps of parallel builders, reviews with a refuter, real-data runs, the full report. Days.

## License

MIT
