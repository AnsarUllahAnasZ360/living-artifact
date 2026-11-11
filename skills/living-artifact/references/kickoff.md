# The kickoff prompt

Short. The book carries everything; the kickoff only points at it, opts in to the agent count, and states the stop rules. Put it in `book.kickoff` so the page has a Copy button.

```
Run <book title>, round <n>, from its book: <book URL>.
Open this chat in <repo path>. The book is the source of truth: read it with the Artifact tool, restore its files if this machine lacks it, read status, run and log with ArtifactData, and follow the living-artifact skill's run.md.
I opt in to workflows of up to <n> agents per wave.
Start from run/current. Probe the checklist's ready items first, ask me once for any only I can supply or confirm, and stop if one is missing. Decide what you can and record it in decided; ask me in chat only when a choice is mine and blocks the work. Ship one PR per category in the PR plan, stacked in one line on <development branch>, one commit per ticket. Prove and review every ticket before its commit is final, and every PR whole and end to end before it opens. Open each PR as soon as it is proven; never wait for a merge. Do not stop for a mid-run review; stop only on the book's stop rules.
When every PR is open, run the agreed checklist once on a fresh copy built from the top of the stack. A ticket is done only when its check passes. Finish with the report section filled (PRs in merge order, lines added and deleted, tests run, checklist results, what works, proven, not proven), the PRs left open for me, and a push notification with the book and PR links.
<one to five lines of rules that are not in CLAUDE.md and matter for this round>
```

## The progress prompt

Put a second prompt in `book.prompts` with `id: "progress"`, so anyone can get a plain status from a fresh chat without touching the run:

```
Read the book at <book URL> with the Artifact tool and its db collections status, run and log with ArtifactData. Do not change anything.
Tell me in plain words, in under ten lines: what step we are on, which PRs are open and what each waits on, which pieces of work stopped and why, and anything that needs me. Link each PR.
```

Rules that already live in the repo's CLAUDE.md are not repeated. Rules about real customer data, cloud databases and deletion are repeated, because a breach cannot be undone.
