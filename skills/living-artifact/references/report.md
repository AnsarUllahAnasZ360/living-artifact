# The completion report

The report is a state of the same book, not a new section or a new artifact. When `round.stage` becomes `report`, the story switches to its `after` claim and lead and lists what works now and what is not proven; every work card shows its proof and its final check; the capability list opens on Works today. A person opening the link sees, in one screen, what they can use, what is proven and what is not.

## Fill it

1. **Story `after`**: a claim in the past tense ("Bookkeepers now get every invoice out in one click") and a lead that says what is built and what is not proven.
2. **`report.works_now`**: three to eight lines a person can try today, 15 words each, in their words.
3. **`report.not_proven`**: every done-when that is not verified, every dropped piece of work and why, every check that failed, was skipped or never ran. Never hidden, never softened. Each ticket's `after_merge` items go here too, as what the person checks after merging.
4. **Status**: every final check's result is in `status/check-<id>` and every ticket's proof in `status/<id>` (`checks`, `lines`, `proof`, `sha`). The cards read these; do not copy them into the report.
5. **Capabilities**: set each item's `state` to match what was proven; items with a ticket follow its live status already.
6. **For agents** (agent mode, History tab): `report.totals` counted from the code host and git, never from memory (`prs_opened`, `prs_merged`, `commits`, `lines_added`, `lines_deleted`, `by_kind` split into production, tests, and docs and config from `git show --numstat`); `report.tests` (one row per kind of check that actually ran, with counts and passes); `report.proof` (one entry per done-when: evidence, verdict `verified`, `not verified` or `inconclusive`, the commit it saw); `report.changed`, `report.found`, `report.attention` (from the cold reviewer), `report.how_to_test`, `report.revert`.

Then set `report.ready`, `round.stage` to `report`, rebuild, republish, and send the person one message with the book link, the PRs in merge order, and anything only they can do.

## The PR body (one per category PR)

Use the repo's own PR template when it has one, in this order: the problems it solves in the person's words; what changed, in plain words, before any file detail; one row per commit (what it fixes, files, lines added and deleted); the line accounting split into production, tests, and docs and config; proof per ticket; what is not proven; the shortest walk for the approver; and the stack (the PR it sits on, the one above it, merge after the one below).

## The retro

When the person asks what could have gone better, read the book: the log, review findings by class, the attention list, review rounds per PR, dropped work, and how the plan changed across rounds. Answer with at most five changes, each aimed at the skill, the project's CLAUDE.md or a check.
