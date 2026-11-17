# Verification: what this skill takes from the Claude Code team

Source: "How the Claude Code team thinks about verification", https://claude.dev/blog/how-the-claude-code-team-thinks-about-verification/ (read 17 November 2026).

Recommendation: prove work by running it, keep the checks out of reach of the change they judge, and use one reviewer in rounds. All of it lives in `references/planning.md` (How we prove it) and `references/run.md` (the junctions); nothing here adds a step to a run.

## What the article says, and where it went

| Lesson | In this skill |
|---|---|
| Verification means running the change. Running the product end to end matters more than tests. | Always rule 8; a `browser` check is written as the flow a person does. |
| If you can pick one test, pick the end to end flow. It is hard to fool and shows the step that failed. | The check table in planning.md; the browser check reports the failing step. |
| Property tests: state what can never fail and let a library try to break it (round trip, invariant, idempotent, equal to a simple version). | The check table in planning.md. |
| Differential tests: the old system is the oracle for a port or migration; list the intended differences. | The check table in planning.md. |
| A feature map, written from the user's view, is both the guide and the rubric. | `plan.verification.checks` are the feature map; scripts sit in `agent/checks/`. |
| Run cheap checks first: tests, build and lint before a pull request. | planning.md rules; run.md code review. |
| A change cannot modify its own checks; review rules are read from the base branch. | Checks and `agent/REVIEW.md` live in the book, outside every pull request. |
| A review applies to one commit; a push makes it stale. | planning.md rules; run.md code review. |
| One reviewer, several rounds, tuned by REVIEW.md. A second reviewer on top is often worse. | run.md: later rounds go to the same reviewer. |
| A check still failing after three rounds goes to a person. | planning.md rules; run.md one wave. |
| Flaky tests: no skip, no sleep, no retry. Find the cause or delete the test and say why. | planning.md rules. |
| Stamp each commit with how it was verified, "none" included. | `how` on every status row. |
| Turn misses into rules, and prune rules. | One line in `agent/REVIEW.md` per miss. |

## Left out on purpose

- A commit gate with off, observe and enforce modes, and formal scoring of the reviewer against known bugs. Both suit a team running hundreds of agents every day; a book for one piece of work does not need them.
