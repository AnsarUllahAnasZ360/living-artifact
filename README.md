# living-artifact

A Claude Code skill for long-running work. Every piece of work, from a small feature to an audit to a multi-week build, runs through **one living HTML page** called the book. The book is the proposal, the plan, the live tracker and the final report, written so a first-time reader understands it in three minutes. Any agent in any session can pick the work up from the book's link alone.

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

A book is written for someone who opens the link with no context and has three minutes. Each section makes one claim in plain words and shows one picture that moves. A book uses only the sections its work needs; a large plan usually has these:

1. **The story**: the headline, one sentence on the problem and the fix, three numbers marked measured, estimated or designed, and one live status line.
2. **Why**: today against the plan, in the same frame.
3. **How it works**: the system as a few named parts, with one job travelling through it step by step, and one failure story.
4. **What it can do**: each capability with its state: works today, being built, planned, later.
5. **Safety, recovery and cost**: a risk grid, a slider that shows the design holding from zero to the top of the range, and a cost chart against the alternative with assumptions you can change.
6. **The build**: steps with progress rings that fill live, a card for each piece of work with its goal, what done means, the proof and its final check, and the final checks with their results.
7. **Beyond**: what comes next and the signal that starts each.

No questions panel, no glossary, no codes or file names in the text. The agent decides what it can, records each decision with who, when and why, and asks you in the chat only when a choice is truly yours. While such a choice blocks the work, the page shows one card for it.

**Agent mode** is the same page with every id switched on, plus a reference section: every ticket with its file, branch and status, the raw files, the raw data, the pull request plan, reviews and rounds. A machine-readable index sits in the page so an agent can read it without rendering it.

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
  scripts/build.mjs    checks book.json and builds the page
  assets/book.html     the page template
  assets/fonts/        Inter and JetBrains Mono, embedded in every page (SIL Open Font License, OFL.txt)
  examples/feature-book a small feature book: five sections, no pull requests
  examples/sample-book a catalog book for a large plan, with sample live data
  research/            the sources the skill is built on
```

| Layer | What it holds | How it changes |
| --- | --- | --- |
| `book.json` | Sections, the shared assumptions, decisions, the plan, the report, and everything agent mode shows | The agent edits it and republishes the same page |
| `agent/` files | The verbatim ask, the checkpoint, research notes, ticket notes, earlier rounds, proof images | Published next to the page |
| Live database | Status of each piece of work, the run state, the log | Written by the run as work happens |

## The build script

```bash
node skills/living-artifact/scripts/build.mjs <book-dir> [--demo seed.json] [--preview]
```

It refuses a broken plan (a piece of work in no step, a dependency on a later step), a section without a component, a map with more than 12 parts, a dash, a missing file, a coloured side border, any request to the network, and a page over its word budget (counted as the browser shows it). It warns on ids, codes and file names in human text (real names go in `book.terms`), on numbers without a unit or certainty mark, on instruction leads and on too many sections. It writes `index.html` and prints the files map to publish. `--demo` sample state goes only into `preview.html`, labelled Sample; `index.html` never carries it.

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
