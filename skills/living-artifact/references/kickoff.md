# The kickoff prompt

Short. The book carries everything; the kickoff only points at it, opts in to the agent count, and states the stop rules. Put it in `book.kickoff` so the page has a Copy button.

```
Run <book title>, round <n>, from its book: <book URL>.
Open this chat in <repo path>. The book is the source of truth: read it with the Artifact tool, restore its files if this machine lacks them, read decisions, feedback and gates with ArtifactData, and follow the living-artifact skill's run.md.
I opt in to workflows of up to 12 agents per wave (at most 6 builders).
Start from run/current. Ship each ticket as its own PR (or the stack in the PR plan) into <development branch>; review every PR by risk before it merges; merge one at a time when proven. Do not stop for a mid-run review; stop only on the book's stop rules.
Finish with every ticket proven on the page, the report section filled, and a push notification with the PR and book links.
<one to five lines of rules that are not in CLAUDE.md and matter for this round>
```

## The progress prompt

Put a second prompt in `book.prompts` with `id: "progress"`, so anyone can get a plain status from a fresh chat without touching the run:

```
Read the book at <book URL> with the Artifact tool and its db collections status, run, log, feedback and gates with ArtifactData. Do not change anything.
Tell me in plain words, in under ten lines: what merged since <when>, which PRs are open and what each waits on (checks, review, a person), what is blocked and on whom, what the next wave is, and every call that needs me. Link each PR and ticket.
```

Rules that already live in the repo's CLAUDE.md are not repeated. Rules about real customer data, cloud databases and deletion are repeated, because a breach cannot be undone.
