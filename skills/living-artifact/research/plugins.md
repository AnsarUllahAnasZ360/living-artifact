# Plugin research for living-artifact

Sources read on 29 Oct 2026:

- **html-plan** 1.0.0 (claude-community marketplace), installed at `~/.claude/plugins/cache/claude-community/html-plan/1.0.0/`. Read: README, plugin.json, `skills/html-plan/SKILL.md`, `references/blocks.md`, `examples/scheduled-send.html`, and the structure of `runtime/pack.mjs` and `runtime/htmlplan.js`.
- **pstack** 0.15.36 (cursor/plugins, `pstack/`), sparse clone in the session scratchpad. Read in full: README, `poteto-mode` SKILL and the multi-phase plan, feature, orchestrate, autopilot-full, prototype, autonomous run, pause safely and session pickup playbooks, `check-plan.mjs`, and the figure-it-out, architect (with the rationale template), swarm, arena, interrogate, ketchup, teach, make-bot-ui, reflect, show-me-your-work, create-verification-skill and statechart skills, the principles they cite, and guide chapters 04 and 07. Read the opening of every other skill, playbook, agent and guide chapter (how, why, recall, unslop, technical-writing, bro, correct, automate-me, poteto-help, setup-pstack, tdd, no-comments, benchmark-checklist, blast-radius, ketchup-video, the verification and formal verification skills, shipping, babysit, opening a PR, bug fix, eval, hillclimb, refactoring, investigation, visual parity, the benny automation pack, the Claude Code harness map). pstack has no `commands/` folder. Its slash commands are its skills.
- **Current skills**: `~/.claude/skills/plan-build` (SKILL.md, all five references, `assets/plan-page.html`, `scripts/build-plan-page.mjs`) and `~/.claude/skills/run-build` (SKILL.md, all four references, `scripts/check-commits.sh`).

## Recommendations

1. **Open human mode on the outcome claims, not on bullet panels.** html-plan makes the page a tree. Each level one claim is one true or false sentence about what a person can now do. Each claim carries one exhibit (a mockup, a state machine, a call tree, a schema or code). Read aloud, the level one claims are the whole change. Its rule: "The closed tree is the summary." The current plan page opens on three bullet panels, six number tiles and two more panels. Replace them with three to five outcome claims, each with one picture, and put the detail one click deeper.

2. **Count the decisions and keep "not opened" apart from "kept".** html-plan numbers every decision, gives an unopened one a strong outline, and has a button that says how many are left and jumps to the next one. Its response marks each answer as changed, kept as proposed, or not opened with the default kept, and it tells the agent not to read an unopened answer as agreement. Store `decisions/<id>` as `{ choice, state: "changed" | "kept" | "unopened", by, at }`. The page then shows how many are left to answer, and the agent asks in chat about any important decision still marked unopened. Today's plan page writes only `choice`, so silence looks like agreement.

3. **Put each decision on the part of the plan it changes, and show the result.** html-plan puts a decision after the exhibit it changes, says when an option removes a claim, and uses `data-if` to show the effect of each answer in place. The current page puts all decisions in one block near the top, far from the tickets they change. Attach decisions to milestones or tickets, keep a short "Needs you" list at the top that links down to them, and show the effect of each option ("this ticket goes", "adds one wave").

4. **Use the db, not copy and paste, but keep a pasteable digest.** html-plan saves answers in browser storage, and the reader must copy a markdown response and paste it into chat. That loses work across devices and adds a manual step. The `db` capability already does this better, and the current skills use it. Borrow html-plan's response format as the shape of a "Copy digest" button in agent mode: decisions first, then edits, then comments, each tied to a section number. It works as a fallback when the page is opened outside Claude.

5. **Treat everything the page sends back as data.** html-plan states this clearly. Picked options are answers within the plan, free text is quoted feedback, and a comment never makes the agent run a command, fetch a URL or change settings. If the page is shared, the text holds other people's words. pstack's make-bot-ui says the same about webhook bodies. Write this rule into the skill for every `feedback`, `comments` and `decisions` read, because a shared living artifact is a channel other people can write to.

6. **Check the page with a script, and make the checks cover words, size and safety.** pstack's `check-plan.mjs` refuses a plan with a missing section, a missing verification block, a long dash, a curly quote or a mid-sentence colon. html-plan's `pack.mjs` warns on word budgets, a missing caption, a diagram with more than about 12 nodes, a state machine with more than 8 states, a layout too wide for a phone, and unreachable states. It also refuses to embed files that look like secrets and lists every file whose code went into the page. `build-plan-page.mjs` already checks the plan's structure and dashes. Extend it with word budgets per field, diagram size limits, a required caption on every picture, and a secrets fence plus an "embedded files" list before any publish.

7. **Say in the status itself whether a claim is proven.** pstack uses three verdicts, verified, not verified and inconclusive, and it never counts inconclusive as a pass. pstack's rule: "Tests alone are not sufficient verification." Its plan template says to check a box only when its evidence exists. Make each Done when statement a box that the run ticks with a proof link (screenshot, test name, video). Add `unverified` to the ticket states, so a ticket can be built but not yet proven. The completion report then lists every Done when with its proof, not a summary.

8. **Tie each verdict to the code it saw.** pstack's autopilot and shipping playbooks say a verdict covers one head SHA, and they compare `git patch-id` before they trust an old verdict after a rebase. Store the commit SHA with each `status/<ticket>` and each proof. When the branch head moves past it, the page marks the proof as old. This stops the page from showing green for code that changed after the check.

9. **Make history an append-only decision log in the db.** pstack's show-me-your-work keeps one row per decision: time, phase, decision, why, evidence pointer, result. Rows are never edited. A wrong row gets a new row that replaces it. Each new run starts with a `start` row. Before hand back, a reviewer on a different model reads the trail and the transcript and writes an "Attention" list of weak evidence and skipped checks. Store these rows as a `log` collection. The page draws them as the history timeline, grouped by feedback round. This replaces the free text `build/CHECKPOINT.md` or mirrors it. Put the Attention list at the top of each round's report.

10. **Open the live page on "what needs you", written like ketchup.** pstack's ketchup opens with one sentence on what waits on the user. Then it gives each item about 30 words: the call, its pick, the evidence and the risk, with the low risk stated too. It never counts items in place of listing them. Its pictures stay small: at most six boxes and eight words in each. Use this as the first screen of human mode while a run is live, above the outcome claims. The current page opens on the summary even mid-run, and the run note is one grey line under the progress bar.

11. **Settle facts by prototype and ask only about taste.** pstack sorts every open question before it asks. If a run can answer it (a layout, a timing, an output), the agent builds a throwaway prototype, puts the variants behind one switcher and lets the result decide. Only product or preference calls go to the human. Apply this to the Decisions list: each decision must be one no experiment can settle. Put the prototype into the artifact as its own published file (through `files`), with the switcher kept, so the user compares variants in the page.

12. **Draw the architecture in steps, not as one big diagram.** pstack's teach skill builds a system picture one part at a time: first A to B, then the same picture with C added. It says one all-in-one diagram is a reference, not teaching. This is the natural shape of the "animation" in human mode. Show the architecture as three to five frames that add one part each, with a step control and reduced motion respected. Keep the full diagram, the source files and the schemas in agent mode.

13. **Scale rigor to the size of the job, and avoid pstack's weight.** pstack's figure-it-out scales rigor to the task. But the multi-phase plan template asks for ten live verification lanes per PR, an hourly audit loop, and the same verification sentence repeated in every block. The plugin has 23 playbooks and 24 principles. That is too heavy for a small feature or an audit. Give living-artifact three profiles. A small feature gets one milestone, one wave and no review gate. An audit gets findings in place of tickets and no waves. A large build gets milestones, waves, gates and the full finish. Choose the profile from the ask and show it on the page.

14. **Keep one artifact for the whole life of the work.** run-build now publishes the implementation report as a second artifact, so the plan and its outcome sit at two links. pstack keeps the plan as a markdown checklist that the run ticks box by box, so the plan and the evidence live in one place. Make the report a section of the same page that fills in at the end. Make each feedback round a new section in the history, and keep the earlier plan visible as "Round 1 plan" instead of overwriting it on republish.

15. **Keep the current skills' strong parts and serve the raw files for agent mode.** Keep goal-sized tickets, waves with a gate, two reviews with a refuter, builder self-proof with screenshots, the kickoff prompt with a Copy button, and live status through the db. These are ahead of both plugins. html-plan inlines everything into one file, and pstack writes plain markdown that agents read. Do both. Publish the human page from one `plan.json`, and publish the raw files (the ask, research, plan.json, kickoff, the decision log export) beside it through `files`, so agent mode lists real paths an agent can read with `Artifact read` and `path`.

## html-plan

**What it is for.** html-plan writes an implementation plan as one hand-written HTML page before any code is built. The user reads it in about a minute, answers the decisions in place, and sends one response back. The agent does not build until that response arrives. The author is Thariq Shihipar, MIT licence.

**Workflow and phases.**

1. Read the code. Find entrypoints, records and screens, with exact paths, lines and the user's own words.
2. Write the level one claims (what a person can now do or see) and read them aloud. Fix them before anything else.
3. Add level two claims (how it works) and level three claims (where, as `file:line`). Then add one exhibit per claim, then the decisions (two to five per plan).
4. Pack. `node runtime/pack.mjs plan.html --root <repo>` lints and inlines the runtime and code excerpts into one file.
5. Look at it in a browser: closed, open, and at each decision.
6. Hand it over with one line that gives the number of decisions and says the defaults are the agent's picks.
7. Act on the response. Apply decisions, schema edits, struck calls and comments, by claim number. If the shape changes, send the page again.

**File layout.**

```
html-plan/1.0.0/
  README.md, .claude-plugin/plugin.json
  skills/html-plan/
    SKILL.md                     the tree rules, the word rules (ASD-STE100), steps, response format
    references/blocks.md         syntax for every custom element
    examples/scheduled-send.html a complete plan
    runtime/htmlplan.js          about 145 KB; custom elements, parsers, comments, response sheet
    runtime/htmlplan.css         about 64 KB
    runtime/pack.mjs             lint, fill code from disk or git, fence secrets, inline to one file; --artifact strips html and body
```

The page uses custom elements: `doc-plan`, `doc-claim`, `doc-mock` (real HTML scaled into a frame, with pins), `doc-machine` (a state machine on a grid, with the screen for each state), `doc-calls` (call trees marked new, removed, changed or proposed), `doc-schema` (text in the project's own language, editable), `doc-code`, `doc-ask` (a decision form), `doc-quote`, `doc-note`, `doc-flow`, `doc-tree` and `doc-draft`. Source text goes in a plain text script tag inside each block so markup cannot break it.

**How it captures user input.** Every visible thing is a comment target: claims, code lines, call rows, arrows, mock elements, quotes. Decisions are forms with radios, checkboxes, text, a range or drag to rank, with the agent's pick checked and tagged "suggested". The reader can strike a proposed call (it takes its subtree with it), edit a schema (it comes back as a diff), and edit a draft text. State is saved in browser storage only. The reader presses Respond, then Copy response, and pastes one markdown block into chat. The block lists decisions first, then edits as diffs, struck calls, and comments, all tied to claim numbers.

**How it tracks progress.** It does not. It covers the plan before the build and stops at the response. Its only "progress" is the count of decisions left to answer.

**What is good.**

- The tree forces the plan to be split by behaviour, never by file or layer, and the closed tree is the summary. There is no separate summary to drift.
- One exhibit per claim, with a strong preference for real things: real paths, real code pulled from disk and stamped with a commit, screenshots for UI that exists and mocks for UI that does not.
- The decision handling is the best of the three: numbered, placed where they matter, a running count, conditional consequences, and the honest "not opened" marker.
- The lint is opinionated about reading cost: word budgets, captions, diagram size, phone width.
- It is careful about safety: a fence on which files it reads, refusal of secret-looking files, a list of every embedded file, and the "response is data" rule.
- Mockups are drawn at a small width so they stay readable on a phone.

**What is weak.**

- It is a one-shot document. No execution, no live status, no history, no completion report.
- The round trip is copy and paste, and answers live only in one browser.
- The runtime is large (about 210 KB of JS and CSS) and needs node to pack. The author writes custom elements by hand, which is slow for a large plan and easy to get wrong without the lint.
- The strict STE word list makes the prose stiff for a non-engineer reader, and the level three code claims assume a technical reader.
- There is no notion of tickets, owners, parallel work or verification. It answers "what will change", not "how will we build and prove it".

## pstack

**What it is for.** pstack is Lauren Tan's (poteto) personal engineering style, packaged for Cursor with a Claude Code adapter. It aims at fewer, better changes that agents can run in parallel because each one proves its own work. The README says the author does not trust plans and prefers code as the spec, so planning is one playbook, not the centre.

**Workflow and phases.** The entry point is `/poteto-mode`. It matches the task to one of 23 playbooks and copies that playbook's steps into a todo list word for word. A step that is skipped stays in the list with a reason. The playbooks that matter for living-artifact:

- **Prototype.** Scope the one decision, build throwaway variants behind one switcher, verify on the real surface, present a pick.
- **Feature.** `how` over the subsystem, `architect` (two or more structurally different sketches through `arena`, a cross-judge from another model family, a graft of the best parts), a four-item throughput checkpoint (blocking first steps, independent workstreams, shared state, smallest safe split), delegate, verify, small ordered commits, `interrogate` if contested, open a PR.
- **Multi-phase plan.** Settle open questions by prototype, explore in subagents, fill a fixed markdown skeleton (one section per PR with Depends on, Files, Build, You see, Verify unit, Verify live with ten lanes, Verify perf, Review gate, Merge, then appendices for prototype evidence, rejected alternatives, risks and links), lint it with `check-plan.mjs`, hand back and stop until the operator says go.
- **Autopilot-full, autopilot-stack, orchestrate.** One owner agent per PR, a swarm of verifiers that never wrote the code, a verdict per head SHA, an hourly audit tick that judges agents by side effects, and a hold order that reaches every owner at once.
- **figure-it-out.** For work with no playbook: frame a falsifiable done predicate, design the phases (riskiest first, harness before work), run each unit as an experiment, log every decision, verify against the predicate.
- **Pause safely and session pickup.** A clean checkpoint a cold agent can resume from, and the rule that the prior trail is authoritative.

Around these sit the review tools (`arena`, `swarm`, `interrogate`, where a finding survives only if a run proves it), the explain tools (`how`, `why`, `teach`, `recall`, `ketchup`, `bro`), the writing tools (`unslop`, `technical-writing`), the verification makers (`create-verification-skill`, formal verification, `statechart`), and 24 one-rule principle skills.

**File layout.**

```
pstack/
  README.md, plugin.json, .cursor-plugin/plugin.json, LICENSE
  agents/poteto-agent.md, comment-sicko.md
  skills/<name>/SKILL.md            about 60 skills, 24 of them principles
  skills/poteto-mode/playbooks/     23 playbooks
  skills/poteto-mode/references/    bugbot triage
  skills/poteto-mode/scripts/       check-plan.mjs (+ test), watch-pr (TypeScript), worktree-audit.sh
  skills/<name>/references/         prompt templates for subagents (explorer, explainer, runner, reviewer, synthesizer)
  skills/statechart/scripts/        TLA+ to Mermaid pipeline and its tests
  skills/show-me-your-work/         decision-log-template.tsv, scripts/log.sh
  docs/guide/01..10                 a ten-chapter user guide
  docs/harness/claude-code.md       maps Cursor tool names to Claude Code
  automations/benny/                dormant Slack triage and repro automations
```

**How it captures user input.** Mostly in chat. Its principle is never to block on the human: do reversible work, show the result, let the human correct it later, and pause only for irreversible actions or real product calls. Prototypes replace most questions. Reviews happen in chat with screenshots and a short video for PRs that change an interaction. `make-bot-ui` is the one place with a page: buttons on a local server POST JSON to a webhook that wakes an agent, with the sender key kept on the server and the body treated as untrusted data. `reflect` shows proposed skill edits and waits for the user to pick which ones apply.

**How it tracks progress.** The todo list holds the playbook's steps. The multi-phase plan is a markdown checklist that owners tick, with the rule that a box is checked only when its evidence exists. `show-me-your-work` keeps an append-only TSV of decisions with evidence pointers, audited against the transcript and reviewed by a different model at the end. Long programs use an hourly loop that posts a status message only when something changed. `ketchup` turns all of this into a plain catch-up with the open calls.

**What is good.**

- Proof is the centre. A real artifact, not a self-report. Verified, not verified or inconclusive. A verdict covers one SHA. The author never verifies their own work.
- Questions are sorted: facts by experiment, taste by the human.
- The decision trail is simple, append-only and honest, with a cross-model check on it.
- The ketchup rules are a precise spec for a "what needs you" screen: one opening sentence, about 30 words per item, a pick, evidence and risk for each, small pictures.
- `teach` gives a clear method for diagrams that build up step by step.
- Rules that repeat get turned into scripts and lints, not more prose.

**What is weak.**

- It is very heavy. Ten live lanes per PR, hourly loops, many model roles to configure, and long playbooks that repeat the same sentences. A small feature pays for ceremony it does not need.
- It is built for Cursor. Many steps name Cursor tools, cloud VMs, Bugbot or skills from another plugin (`deslop`, `control-ui`), and Claude Code users go through a mapping file.
- The human sees markdown, TSV and chat. There is no visual plan page, no live view of the run, and no structured place to answer decisions.
- Its voice is that of an expert engineer, and many playbooks assume the reader knows git internals, patch-ids and forge tools.
- Planning is a side path. There are no milestones as outcomes, no waves, and no ticket sizing.

## Comparison

| | html-plan | pstack | plan-build and run-build (current) |
|---|---|---|---|
| Phases | Read code, write claims, add exhibits and decisions, pack, look, hand over, act on the response | Route to a playbook. For planning: prototype, explore, fill the skeleton, lint, hand back. For running: owners, swarm verdicts, audit loop, merge | Ask, read, research, prototype, explain, tickets, milestones, waves, verification, publish, kickoff, cold review. Then waves with gates, finish, PR, report |
| Artifact format | One packed HTML file of custom elements, or an artifact body | Markdown plan, TSV decision log, chat replies | An HTML page built from `plan.json`, published with `db`. A second artifact for the report |
| Live state | None. Answers sit in browser storage | Checkboxes in the plan file, TSV rows, hourly status messages | `status`, `run`, `decisions` and `feedback` collections, painted live |
| User input | Decisions as forms, comments on any element, struck calls, schema and text edits, then copy and paste | Chat, prototypes in place of questions, review in chat with screenshots and video | Radio decisions (owner only) and free text feedback per ticket or plan, read by the run |
| Review loops | One round, repeated if the answers change the plan's shape | `architect` and `arena` with a cross-judge, `interrogate` adversaries, swarm verifiers per head, `reflect` | Two reviews per wave with a refuter, a lead spot check, a cold read of the plan, a user review pause, a fix loop |
| Verification | None. It is a plan only | Unit, live and perf per PR, verdict per SHA, inconclusive is not a pass, the trail audited by another model | Builder self-proof with tests and screenshots, a forced gate per wave, a merged-app walk, videos, a commit check script |

## Where the current plan-build page falls short

Judged as a designer would judge `assets/plan-page.html` with a typical 15 to 20 ticket plan.

**Density.**

- The summary is about 30 bullet lines before any picture: three panels of three to six bullets, six number tiles, then two more panels. There is no diagram, mockup or screenshot anywhere on the page, although the skill asks for one diagram and a prototype. `plan.json` has no field for either.
- The number tiles repeat themselves. "Waves of parallel work" and "checkpoints" show the same number. "Agents at once" and "builder agents in all" make the reader do sums that do not change a decision.
- The roadmap shows the same waves three times: a row of wave buttons, a sideways scrolling lane of wave columns, and a milestone by wave table of coloured squares.
- Each ticket opens to seven labelled blocks and its own feedback text box. Twenty tickets give twenty text boxes.
- "How the run works" and "Where we verify" are mostly the same text in every plan. They take two full sections, but they describe the skill, not this plan.

**Hierarchy.**

- Small uppercase labels with letter spacing appear in about nine places (eyebrow, panel titles, wave label, Done when title, ticket block titles, table headers, overview labels, step labels, the Recommended tag). When everything is a label, nothing leads.
- Most text is muted grey at 12 to 14 px. The section titles (22 px) are only a little larger than milestone titles (18 px), so the eye has no clear path down the page.
- Nothing is the primary action. Decisions sit second but look like every other panel. There is no count of what is left to answer.
- During a run the page still opens on the summary. Live state is one progress bar and one grey line in the header. The roadmap does not mark the current wave, and the user must scroll to find what changed.
- Milestone colour is the only grouping signal in the roadmap. Status pills use a second palette of five colours. Together that is up to 13 hues on one screen.

**Interaction.**

- A decision saves the moment a radio changes, with no confirm or undo. Only the owner can write, so other viewers learn this only after they click, from a small error line.
- Feedback has no state. The writer cannot see whether the run read it, acted on it, or turned it down, so the loop feels one way.
- The wave lane scrolls sideways inside its own box, and the milestone table also needs sideways scroll on a phone. On mobile the ticket summary row stacks into three lines per ticket.
- There is no filter by status, wave or milestone, and no way to see only blocked or in review tickets.
- Status pills show a word but no proof, no screenshot and no commit, so "Done" cannot be checked from the page.
- There is no agent mode. The raw `plan.json`, research and kickoff exist only on disk and in the kickoff text.
- Republishing replaces the plan, so the earlier rounds and what changed between them disappear. The report lives at a second link.
- What works and should stay: the "Live" or "Offline copy" indicator, the Copy prompt button with a select fallback, deep links that open a ticket, the light and dark tokens, and the plain words and no short codes rule. As run-build says, "Nothing is done until there is proof a person can look at."
