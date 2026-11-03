# The completion report

The report is a section of the book, not a new artifact. It fills in when the run finishes; until then the page shows it greyed with empty numbers.

The person opens the book and must see, in one screen: how much was shipped, how it was tested, what works now, what is proven, what is not, and what needs them.

## Fill `book.report`

1. **blocked_on_you**: first, always. Each item is one action with its link: approve a PR, run one command, answer a decision.
2. **totals**: counted from the code host and git, never from memory. `prs_opened`, `prs_merged`, `commits`, `lines_added`, `lines_deleted`, and `by_kind`: production, tests, and docs and config, each with added and deleted (`git show --numstat` per commit, classified by path).
3. **tests**: one row per kind of check that actually ran, with how many and how many passed: unit and integration tests, type checks and lint, CI runs, browser walks, end-to-end runs on the local stack, real data runs, reviews (rounds and findings fixed). A kind that did not run is not listed as passed; it goes to `not_proven`.
4. **works_now**: three to eight lines a person can try today, each in their words ("Saying I'm done lists what is still unreviewed").
5. **proof**: one entry per done-when of every outcome. Evidence (screenshot, short video, test name with its output, a measured number), a verdict (verified, not verified or inconclusive), and the commit the evidence saw.
6. **not_proven**: every done-when that is not verified, every dropped ticket and why, and every check that was skipped. Never hidden, never softened.
7. **changed**: three to seven lines a teammate needs: behaviour that is different now, migrations, new settings, removed features.
8. **found**: pre-existing bugs, risks, follow-ups, each with where it was seen.
9. **attention**: from the cold reviewer who read the log, the PRs and the evidence: weak proof, skipped checks, anything that looks green but is not.
10. **how_to_test**: the shortest walk a teammate can repeat. **revert**: how to undo it.

Then: set `report.ready`, `round.stage` to `report`, rebuild, republish, and send one push notification with the book link and the PR links.

## The PR body (one per category PR)

Use the repo's own PR template when it has one, filled in this order:

- **Problems**: the problems this PR solves, one line each, in the user's words.
- **What changed**: the behaviour now, in plain words, before any file detail.
- **Commits**: one row per ticket: what it fixes, the files, lines added and deleted.
- **Accounting**: production, tests, and docs and config, added and deleted, with a reason for anything large.
- **Proof**: per ticket, the tests that ran and the screenshots or run evidence; the end-to-end run.
- **Not proven**: what was not checked and why, and any ticket dropped from this PR.
- **How to check**: the shortest walk for the approver.

## The retro

When the user asks what could have gone better, read the book: the log, the review findings by class, the attention list, how many review rounds each PR took, which tickets were dropped, and how the plan changed across rounds. Answer with at most five changes, each aimed at the skill, the project's CLAUDE.md, or a check. Put accepted lessons there, not into the next prompt.
