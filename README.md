# living-artifact

A Claude Code skill for long-running work. Every piece of work, from a small feature to an audit to a multi-week build, runs through **one living HTML page** called the book. The book is the plan, the live tracker, the decision log, the docs and the final report. Any agent in any session can pick the work up from the book's link alone.

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

Ask in your own words. The skill starts when you bring a problem to explore, ask for a plan or tickets, paste a kickoff, give feedback on a book, or ask for a report. For example:

- "Plan the new export flow with the living-artifact skill."
- "Audit our onboarding and write up what to fix."
- "Here is my feedback on the book, start the next round."
- "Run the build from this book: <link>."

## How it works

Work moves through stages, and feedback at any stage starts a new round in the same book:

```
frame -> explore <-> feedback -> plan <-> feedback -> run -> verify -> report -> next round
```

1. **Frame.** Your words go verbatim into `agent/ASK.md`. The agent turns them into three to five outcome claims you can check.
2. **Explore.** It reads the code, runs research agents, and records findings with evidence (a file and line, a screenshot, a number).
3. **Plan.** Goal-sized tickets, grouped into milestones people can see working, scheduled into parallel waves where no two builders touch the same files. Every choice you must make becomes a decision card with a recommendation.
4. **Approve.** You read the book, answer the decisions and approve the plan on the page. Nothing builds before that.
5. **Run.** A kickoff prompt starts a fresh session. It opens a draft PR first, runs each wave, lands one commit per ticket, and writes every status change to the page as it happens.
6. **Verify.** Each wave ends with the gate (tests, types, build), fresh-eyes reviews scaled by risk, and a browser check. A ticket is done only with its proof.
7. **Report.** The book fills its completion report: what shipped, proof per outcome, what did not ship and why, and a short retro.

The page has two modes. **Human mode** is for the person who owns the work: pictures, status and decisions, very little text. **Agent mode** shows every raw file the agents use.

## Components

```
.claude-plugin/
  plugin.json          the plugin
  marketplace.json     lets /plugin marketplace add find it
skills/living-artifact/
  SKILL.md             the loop, the profiles, the rules every stage follows
  references/
    method.md          what each stage produces
    data-model.md      the book.json shape, the agent files, the live database
    planning.md        tickets, milestones, waves, decisions, verification
    run.md             the orchestrator: draft PR, wave workflow, reviews, status writes
    report.md          the completion report, proof and retro
    kickoff.md         the kickoff prompt template
    design.md          how human mode reads, and word budgets per field
  scripts/build.mjs    checks book.json and builds the page
  assets/book.html     the page template
  examples/sample-book a full sample book with demo live data
  research/            the sources the skill is built on
```

**The three layers of a book**

| Layer | What it holds | How it changes |
| --- | --- | --- |
| `book.json` | Problem, outcomes, findings, research, plan, decisions, kickoff, report, history | The agent edits it and republishes the same page |
| `agent/` files | Verbatim ask, checkpoint ledger, research notes, earlier rounds | Published next to the page for agents |
| Live database | Ticket status, run state, log, your decisions, feedback, approvals | Written as work happens, so the page is always current |

**The build script**

```bash
node skills/living-artifact/scripts/build.mjs <book-dir> [--demo seed.json] [--preview]
```

It refuses a book with a ticket in no wave, a dependency on a later wave, a dash in human text or a missing field. It warns on word budgets and on two builders in one wave sharing files. It writes `index.html` and prints the files map to publish.

Try it on the sample:

```bash
node skills/living-artifact/scripts/build.mjs skills/living-artifact/examples/sample-book --demo skills/living-artifact/examples/sample-book/db-seed.json --preview
```

## Profiles

- **feature**: one milestone, one agent, the gate and one review. Hours.
- **audit**: findings and recommendations with evidence, no waves unless fixes follow.
- **large**: milestones, waves of parallel builders, gates, reviews with a refuter, real-data runs, the full report. Days.

## License

MIT
