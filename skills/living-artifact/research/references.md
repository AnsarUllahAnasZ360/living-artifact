# References for the living-artifact skill

Read on 2026-10-29. All six sources were read in full.

Sources:

1. Thariq Shihipar, "Using Claude Code: the unreasonable effectiveness of HTML", claude.dev blog, May 2026. https://claude.dev/blog/using-claude-code-the-unreasonable-effectiveness-of-html/
2. "Solving code review at Anthropic" (how the Claude Code team does code review), claude.dev blog. https://claude.dev/blog/solving-code-review-at-anthropic/
3. "Getting the most out of Opus 5.5", claude.dev blog. https://claude.dev/blog/getting-the-most-out-of-opus-5-5/
4. "The new rules of context engineering for Claude 5 generation models", claude.dev blog. https://claude.dev/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models/
5. Addy Osmani, "How the Claude Code team does code review", X article, Oct 26 2026. https://x.com/addyosmani/status/2114604912520921136 (a rewrite of source 2 with some extra detail)
6. Addy Osmani, "You're probably overprompting Claude", X article, Oct 29 2026. https://x.com/addyosmani/status/2115688494865465370

How they were read: sources 1 to 4 through WebFetch. Sources 5 and 6 returned HTTP 402 to WebFetch and were read in full through the in-app browser.

## Recommendations for the skill

1. **One HTML page is the source of truth, not a pile of markdown.** People stop reading markdown past about 100 lines, and an HTML page with tabs, diagrams and callouts gets read and shared as a link. The artifact replaces the long plan doc and the ticket tracker. (1, 4)

2. **Human mode is for staying in the loop, so it must be fast to scan.** Lead each section with a diagram, a status, or a decision, not prose. Use tabs per stage (problem, research, architecture, prototype, plan, progress, report). Use SVG, never ASCII art or unicode color hacks. (1)

3. **Agent mode holds rich references, not summaries.** Keep the raw files the agents need: the spec, HTML mockups, test names, interface signatures, code to port, rubrics. A code-based reference beats a description or a screenshot. Prototypes live in the artifact as working HTML, and builders port them. (4, 1)

4. **Every interactive part ends with an export.** Reprioritising tickets, choosing between approaches, tuning a value, or leaving feedback should end in "copy as prompt" or "copy as JSON" so the result goes straight back to Claude. Feedback rounds enter the artifact this way. (1)

5. **Plan by interview, then hand off to a fresh session.** If the goal is unclear, Claude interviews the user until it can write the spec. The kickoff is a short prompt in a new chat that points at the artifact. The planning chat's history is not carried over; the artifact is. (6, 1)

6. **Every ticket and every milestone states a goal, a finish line, and a proof.** Write "done means ..." in plain words plus the runnable check that proves it (test, build, screenshot, number to beat). Something that reports pass or fail, or a number, lets an agent keep going without a human watching. Prefer fewer, bigger, goal-sized tickets over many small ones. (3, 6, 2)

7. **Keep orchestrator and builder prompts short.** One clear goal and how to verify it. Drop "think carefully" lines and long rule lists; set effort instead (start at medium). Name concrete things to avoid rather than vague style rules. Put stop rules in plain words: keep going unless blocked or about to do something destructive. (3, 6, 4)

8. **Use parallel agents only for substantial, standalone units.** Waves make sense for audits, migrations and large builds split into independent units. For small work a single agent is cheaper, faster and often better. Subagents add parallelism or a second opinion, not intelligence. The orchestrator checks each agent's evidence before accepting its result. (6, 3)

9. **Progress lives in the artifact, not the scrollback.** Builders tick tickets in the artifact's state (the equivalent of a TASKS.md checklist) so status survives summarization, compaction and new sessions. Settled decisions are marked settled so later loops do not reopen them. (3)

10. **Verification is the biggest lever.** Builders must show output (command and result, test run, screenshot) rather than claim success. The report's proof section links that evidence. A verification step roughly doubles or triples quality. (2, 5, 6)

11. **Review in fresh context, against the spec.** After a builder finishes, a reviewer that has not seen the build conversation reads the diff plus the artifact's spec, ignores style, and lists only merge-blocking problems with file, line, why it is wrong, and how to show it fails. Findings get severity tags (Important, Nit, Pre-existing) so old bugs are not blamed on the ticket. (2, 3, 5, 6)

12. **Every finding is answered and recorded.** Each review finding is either fixed or closed with a one-line reason, and that decision is written into the artifact. Bot approval never stands in for the user's approval on decisions the user owns. (2, 5)

13. **Review loops must converge.** Cap at three review rounds, then ask whether the approach is wrong. After the first rounds, re-review only the new diff. Name the bug class so the builder fixes every instance. Never repeat a finding already posted. Pre-existing bugs go to a separate list, not into the ticket's loop. (2, 5)

14. **Scale review depth to risk, set by the change.** Each ticket carries a risk tier (low, medium, high) based on what it touches, not who wrote it. Low risk: automated checks only. Sensitive areas (auth, billing, CI, release, data deletion): deep review and a named human gate. (2, 5)

15. **Every completion report starts with what the user must do.** Put "Blocked on you", then "Changed", then "Found" at the top. Mark anything not confirmed and say where Claude looked. Include how to test and how to revert. (3, 2)

16. **The skill itself stays light and splits into files.** Short SKILL.md, then separate files loaded only when needed (design, planning, orchestrator prompt, builder prompt, review, report). Encode the user's own opinions and project gotchas, avoid rules the model already follows, and do not contradict CLAUDE.md. Audit and trim it every few months. (4, 6)

17. **Feedback rounds collapse, decisions persist.** Old loops fold into a history section; the current state, open questions and settled decisions stay on top. When a direction looks wrong, raise it early in the loop rather than after the build is done; discarding agent work is cheap. (2, 1)

18. **The artifact doubles as the explainer.** Since agents do most of the reading, the human learns the change from the artifact's architecture diagrams and annotated diff view, kept current with the code. Diffs can be rendered with margin notes color coded by severity. (2, 5, 1)

19. **Turn misses into context.** When a review or verification misses something, ask what was missing from the context and add it to the artifact's agent files, the project CLAUDE.md, a REVIEW.md, or a check. Repeated findings get fixed at the source, not re-found every round. (2, 5)

## Source 1: The unreasonable effectiveness of HTML

- Markdown is limiting for agent output: hard to read past about 100 lines, no color or diagrams, awkward to share. Claude edits the files anyway, so markdown's editing advantage is gone.
- HTML can hold almost any information Claude can read: tables, SVG, code, interactive controls, spatial layout, images.
- A long spec becomes navigable with tabs (overview, API, rollout), callouts, charts and an open-questions block.
- Shared as a link, an HTML page is far more likely to be read than an attached markdown file.
- Two-way interaction: sliders, editors and boards that end in a copy-as-prompt or copy-as-JSON button feed the result back into Claude Code.
- Planning works as a web of HTML files by stage: brainstorm approaches in a grid with tradeoffs, expand one with mockups, then write the implementation plan. Implementation starts in a new session that is given these files. Verification agents read the same files.
- Code review use: render the diff with inline margin notes colored by severity, plus flowcharts and module maps.
- Without HTML the model falls back to ASCII diagrams and unicode color tricks.
- Extra token cost is worth it because the human actually reads the result.
- Quote: "I feel more in the loop now than I ever did before."

## Source 2: Solving code review at Anthropic

- Goal: the least human review time that does not raise reverts or incidents. Human time counts both reviewing and fixing what bad code breaks.
- Review is continuous, like spellcheck, not one gate at the end. Most changes are reviewed and fixed by Claude before a human looks.
- Layers instead of one gate: verified before PR, AI review on every PR, blocking security review, blocking CI, risk-scaled human approval, merge queue with flags and staged release, fast rollback.
- Pre-PR verification: Claude runs something and shows the output; a fresh-context subagent reviews the diff. Verification is estimated at two to three times better results.
- AI review: parallel bug hunters, a separate vote to confirm each finding, style and cleanup findings dropped, severity tags (Important, Nit, Pre-existing). Every finding is fixed or closed with a reason.
- Review must converge: one PR looped over 50 rounds overnight, and about 59% of repeat flags were old code. Fixes: cap at three rounds, diff-only re-review, name the bug class, no repeats, separate nightly sweeps for old bugs. Mean rounds fell from 2.08 to 1.32.
- Risk tier is set by the change, not the author. An agent's approval never counts as a person's. Approvals apply to one commit.
- Humans stay for direction and scope, risky code, architecture others will copy, reading evidence, and owning outcomes.
- Shared understanding now comes from on-demand explainers and small visual artifacts of the code slice, not from reading diffs.
- Quote: "Review has to converge."

## Source 3: Getting the most out of Opus 5.5

- Give the whole task and state the finish line in a done-means sentence, plus when to stop and ask. Then let it run for hours.
- Remove think-hard style instructions; adjust effort instead. Ask for a direct answer on simple questions.
- Name specific design patterns to avoid, since a vague request to avoid a generic look just swaps one default for another.
- Write stop rules: keep going when a step needs no input, put status notes in the same message as the next action, stop only when blocked or before destructive actions.
- Split big audits, migrations and reviews across subagents, check each one's evidence, and finish with one summary table.
- Keep the task list in a file and read it instead of the scrollback; it survives summarization in long runs.
- End runs with three headings: Blocked on me, Changed, Found. Ask the model to mark what it could not confirm and where it looked.
- Run a review pass before a human: only merge-blocking problems, each with file, line, reason and how to show it fails.
- Mark settled answers as done in long chats, except during analysis where a later step may reveal an earlier mistake.
- Quote: "Check its evidence before you accept it."

## Source 4: The new rules of context engineering

- Context is the whole stack: system prompt, skills, CLAUDE.md, memory, references, then the user's prompt. Most of it applies across many requests, so it must be general.
- Anthropic had over-constrained Claude Code with conflicting rules across prompt, CLAUDE.md and skills. Removing over 80% of the system prompt caused no measurable loss on coding evals.
- Shift from rules to judgment: describe the intent (match the surrounding code) instead of rigid rules.
- Shift from examples to well-designed interfaces: a short tool description, a status enum, and one rule (only one task in progress) replaced about 9,100 characters of examples.
- Use progressive disclosure: a tree of files loaded at the right time, not one central file with every practice. Review and verification became separate skills.
- Tool instructions belong in the tool description, not repeated elsewhere.
- Specs can now be rich: HTML artifacts, detailed tests, code to port, and rubrics checked by verifier agents.
- Skills should be light guides that encode the team's own opinions and gotchas, split across files, strict only where stakes are high.
- Audit skills and CLAUDE.md for conflicts; `/doctor` helps.
- Quote: "a HTML mockup of a design will generally produce better results"

## Source 5: Addy Osmani on code review (X)

- Same process as source 2, retold, with a few extra details below.
- Boris Cherny calls a verification process probably the biggest key to quality; verification can be a bash command, a test suite, or a browser or simulator check.
- Good REVIEW.md files define what failure means in that area, limit nits, list ignored paths, require file and line references, and require a summary with a count and a clear no-issues line.
- The reviewer checks that the change solves the stated issue, fits the larger system, and does not break other parts; for bug fixes it looks for the root cause.
- Agent authors pay more for review noise than humans: a nit a human dismisses in a second costs an agent another commit and another review cycle.
- Agents often fix findings overnight, so the author returns to a PR that has already had another pass.
- If you cannot say what the checks would miss, a quick thumbs up is not enough; do a real review.
- When reviewers miss something, ask what was not in the model's context and turn it into a CLAUDE.md line, a skill, or a check.
- Pivot early: challenge a direction early in the thread, not as a blocking comment on a finished PR.
- Quote: "Agent approvals don't count as human approvals."

## Source 6: Addy Osmani on overprompting (X)

- Newer models need less prompting. Give one prompt with a clear goal and how Claude should verify it, then let it work. Start at medium effort.
- If the goal is unclear, have Claude interview you until it could write a spec, then build from that spec in a new session.
- A check that reports pass or fail, or a number to beat, in a form Claude can read, lets it keep going unattended. `/goal` can set a condition a separate model checks every turn.
- When Claude reports back, ask for the command and output or a screenshot.
- Remove instructions, then add back only what the model misses. Audit how you work every few months.
- Claude delegates to subagents on its own. Ask only for substantial standalone work; for small jobs subagents add cost and latency and do not make the result smarter.
- A single agent with skills often beats a multi-agent design on quality, cost and latency.
- Parallel sessions only pay off once one session can finish without you. Projects act as the manager that tracks which threads are done and what needs input.
- For review, a fresh session or `/code-review` with the spec, told to ignore style, works well.
- Quote: "Newer models require less prompting than most of us still do."

## What this changes in practice

A planning-and-build skill built on these sources should not produce dozens of small tickets and a long markdown plan. It should produce one page a person can scan in minutes and an agent can work from without the planning chat.

- **One page, two readers.** The human sees diagrams, status and decisions; the agent reads full specs, mockups, test names and prompts from the same artifact. No separate plan doc, tracker and report that drift apart.
- **Fewer, bigger tickets with proof.** Each ticket is a goal with "done means" and a runnable check, sized so one agent can finish it alone. Small tickets multiply review rounds, handoffs and subagent cost without adding quality.
- **Short prompts, rich references.** Orchestrator and builder prompts shrink to goal, finish line, proof and stop rules. The detail moves into references (HTML prototypes, interfaces, rubrics) that the agent reads on demand, instead of long rule lists repeated in every prompt.
- **Waves only where work is truly independent.** Parallel agents are used for big, separable units. Otherwise one agent with the skill does the work.
- **State lives in the artifact.** Progress, settled decisions and feedback history are written to the artifact so a fresh session picks up exactly where the last one stopped, and compaction loses nothing important.
- **Review is a bounded loop with a record.** Fresh-context review against the spec, severity tags, every finding answered, three rounds at most, diff-only after that, pre-existing bugs parked separately. Risk tier per ticket decides the depth and whether the user must sign off.
- **The report is evidence first.** It opens with what the user must do, then what changed and what was found, with linked command output and screenshots, unconfirmed items marked, and how to revert.
- **Feedback flows back as prompts.** Interactive parts of the page end in "copy as prompt", so each loop of research, build and feedback starts from the page rather than from memory.
