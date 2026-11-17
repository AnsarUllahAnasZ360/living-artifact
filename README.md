# living-artifact

A Claude Code skill for work you run yourself with coding agents. Each piece of work runs through **one living HTML page** called the book: the problems, the tickets, the plan and the proof, with live status on every ticket. Any agent in any session can pick the work up from the book's link alone. It is not for handing tasks to a team.

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

Ask in your own words. The skill starts when you bring problems to explore, ask for a plan or tickets for agents, paste a kickoff, give feedback on a book, or ask what was proven. For example:

- "Plan the new export flow with the living-artifact skill."
- "Here is my feedback on the book, start the next round."
- "Run the build from this book: <link>."

## The page

A left sidebar shows one section at a time, with a theme control and a Human or Agent switch:

1. **Summary**: a headline, two or three short paragraphs and 3 to 6 real numbers.
2. **Problems**: one list in the manner of Linear, with a status worked out from each problem's tickets. A row opens a side panel (resize, expand, full screen) with the problem, why it matters, what we found with evidence, the fix with pictures and prototypes first, the outcome, and the tickets that fix it.
3. **Tickets**: the same list and panel, with live status and wave and pull request chips, grouped by wave, pull request or problem.
4. **Plan**: the goal, counts the build computes, the waves with what each gives you and the reviews and browser checks placed between them, the pull requests, and how the work is proven.
5. **Proof**: a completion report that fills in as work lands.

Proof means running the change: anything a person can see is proven by doing the flow on the running product, with tests behind it. Cheap checks run first, the checks live in the book where the change cannot edit them, one reviewer works in rounds, and a check still failing after three rounds goes to you. The rules follow [how the Claude Code team thinks about verification](https://claude.dev/blog/how-the-claude-code-team-thinks-about-verification/); see `skills/living-artifact/research/verification.md`.

## How it works

```
ask -> explore problems <-> feedback -> plan <-> feedback -> run waves -> prove -> next round
```

- **Waves come from the dependency graph.** A ticket runs in the earliest wave where what it needs is done and no other ticket in that wave edits the same file. In a wave one agent per ticket starts at once; each ticket is one commit.
- **Roles.** Opus agents build tickets and do browser checks. A Fable agent reviews every pull request. The session that runs the book orchestrates.
- **No time estimates.** The plan counts work instead.
- **Questions go to you in chat**, never onto the page.

## Components

```
.claude-plugin/
  plugin.json          the plugin
  marketplace.json     lets /plugin marketplace add find it
skills/living-artifact/
  SKILL.md             the page, the loop, the roles, the rules
  references/
    method.md          the stages, from the ask to the next round
    data-model.md      book.json version 2, the agent files, the live database
    planning.md        tickets, the dependency graph, waves, junctions, proof
    run.md             running the waves, the reviews and checks, filling Proof
    kickoff.md         the kickoff prompt, kept as an agent file
    design.md          how each section reads, and word budgets
  scripts/build.mjs    checks book.json, computes the counts, builds the page
  assets/book.html     the page template
  examples/sample-book a full version 2 sample book with demo live data
  research/            the sources the skill is built on
```

**The three layers of a book**

| Layer | What it holds | How it changes |
| --- | --- | --- |
| `book.json` | Summary, problems, plan, proof | The agent edits it and republishes the same page |
| `agent/`, `shots/`, `proto/` | Verbatim ask, checkpoint, research, kickoff, earlier rounds, screenshots, prototypes | Published next to the page |
| Live database | Ticket status, run state, log | Written as work happens, so every row is current |

**The build script**

```bash
node skills/living-artifact/scripts/build.mjs <book-dir> [--demo seed.json] [--preview]
```

It refuses a dependency that is not in an earlier wave, two tickets in one wave that edit the same file, a ticket without a problem, files or proof, a Fable browser check, a removed section, a dash in human text and an unpublished picture. It warns when a ticket could run sooner and on word budgets. It writes `index.html` and prints the files map to publish.

Try it on the sample:

```bash
node skills/living-artifact/scripts/build.mjs skills/living-artifact/examples/sample-book --demo skills/living-artifact/examples/sample-book/db-seed.json
```

## License

MIT
