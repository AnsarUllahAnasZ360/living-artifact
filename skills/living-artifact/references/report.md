# The completion report

The report is a section of the book, not a new artifact. It fills in when the run finishes; until then the page shows it greyed.

The user does not need a list of what was done: the progress section already shows every ticket. The report answers three questions: what needs me, is it proven, and what should I know.

## Fill `book.report`

1. **blocked_on_you**: first, always. Each item is one action with its link: review the PR, run one command, answer a decision, share the book with the team.
2. **proof**: one entry per done-when of every outcome. Evidence (screenshot, short video, test name with its output, a measured number) and a verdict: verified, not verified or inconclusive. The commit the evidence saw. Not verified and inconclusive are listed plainly, never hidden.
3. **changed**: three to seven lines a teammate needs: behaviour that is different now, migrations, new settings, removed features.
4. **found**: pre-existing bugs, risks, follow-ups. Each with where Claude looked.
5. **attention**: from the cold reviewer who read the log and the evidence: weak proof, skipped checks, anything that looks green but is not.
6. **how_to_test**: the shortest walk a teammate can repeat.
7. **revert**: how to undo it.

Then: set `report.ready`, `round.stage` to `report`, rebuild, republish, mark the PR ready only if the user asked, finish the PR body (summary, proof link to the book, how to test, decisions taken, the user's attribution rules), and send one push notification with the PR and book links.

## The PR body

Short. What changed for the user, in three to five lines. A link to the book for the plan, the progress and the proof. Migrations and settings. How to test. What reviewers should look at first (the high-risk tickets).

## The retro

When the user asks what could have gone better, read the book: the log, the review findings by class, the attention list, how many review rounds each wave took, which tickets failed the spot check, and how the plan changed across rounds. Answer with at most five changes, each aimed at the skill, the project's CLAUDE.md, or a check. Put accepted lessons there, not into the next prompt.
