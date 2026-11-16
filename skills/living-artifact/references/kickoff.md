# The kickoff prompt

Short. The book carries everything; the kickoff only points at it. Write it to `agent/prompts/kickoff.md`; it is an agent file and never shows on the page. The user pastes it into a fresh session opened in the repo.

```
Run <book title> from its book: <book URL>.
Open this chat in <repo path>. The book is the source of truth: read it with the Artifact tool, restore its files if this machine lacks them, and follow the living-artifact skill's references/run.md.
Start from run/current and agent/CHECKPOINT.md. Run the waves in order. In each wave start one Opus agent per ticket, all at once; each ticket lands as one commit on its pull request's branch. At each junction the plan names, do exactly that: a Fable agent reviews every pull request and improves it or sends it back, an Opus agent does every browser check.
Write status, run and log to the book's db as you go. Leave every pull request open for me unless the plan places a merge. When the last junction passes, fill the Proof tab and tell me with the book link.
<one to five lines of rules that are not in the repo's CLAUDE.md and matter for this work>
```

Rules that already live in the repo's CLAUDE.md are not repeated. Rules about real customer data, cloud databases and deletion are repeated, because a breach cannot be undone.

## Asking for progress

Anyone can get a plain status from a fresh session without touching the run:

```
Read the book at <book URL> with the Artifact tool and its db collections status, run and log with ArtifactData. Do not change anything.
In under ten lines: which wave is running, which tickets are built, reviewed and verified, which are blocked and why, which pull requests are open, and anything that needs me.
```
