---
description: "Show the pipeline: all specs and their current status"
---

Read `CLAUDE.md` and the referenced spec before acting.

Scan the frontmatter of every `specs/**/spec.md` (epics, features, their stories, and quick specs) and print a pipeline overview table:

- **Leave `specs/archive/` out of the table.** Archived specs are shipped and closed; summarize them as a single line at the end (e.g. "archive: 4 features, 2 quick specs") and skip the stale check for them. Conversely, flag any `done` spec still sitting at the top level of `specs/` as ready to archive, with the `mv` to run, in the next-actions list (this command stays read-only and does not move it).

- Group each epic (EPIC-XXX) with the features that carry its `epic:` id nested underneath, and each feature with its stories nested under it (id, name, status, approved_by, pr). Mark any spec whose frontmatter has `auto: true` with an `[auto]` tag, so the maintainer can see at a glance where their gates are delegated, and show `approved_by: auto (delegated by the maintainer)` as it is, since it tells them which approvals to audit at PR review.
- Features with no `epic:` value are standalone; list them in their own group after the epics.
- Include QUICK-XXX specs in their own group.
- **Highlight the maintainer's two queues separately**, since they ask different things of them and they can clear one from their phone:
  - `awaiting-discussion`: **needs a decision.** Something is still open. For each, show the count of unresolved open questions and blocker/should-fix findings, and for a parked story, the one-line reason it parked. These need `/spec:discuss <id>` at a desk.
  - `awaiting-approval`: **needs a stamp.** Nothing is open. These need only `/spec:approve <id>`.
  Both block their downstream phases. Keep the discussion queue first: it is the one that gates everything else.
- Flag anything stuck: use `git log --follow` on each spec.md to see when its `status:` line last changed, and mark specs sitting in the same status for a long time (e.g. more than 7 days) as stale.
- **Call out a feature with several parked stories as one problem, not several.** That pattern means the feature was approved with an unresolved design question, and the fix is one conversation about the feature.

Read-only: this command changes no spec. End with a short "next actions" list, split the same way: what needs the maintainer to decide, what needs only their stamp, and which specs an agent can pick up next.
