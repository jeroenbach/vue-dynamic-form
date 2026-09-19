---
description: "Show the pipeline: all specs and their current status"
---

Read `CLAUDE.md` and the referenced spec before acting.

Scan the frontmatter of every `specs/**/spec.md` (epics, features, their stories, and quick specs) and print a pipeline overview table:

- Group each epic (EPIC-XXX) with the features that carry its `epic:` id nested underneath, and each feature with its stories nested under it (id, name, status, approved_by, pr).
- Features with no `epic:` value are standalone; list them in their own group after the epics.
- Include QUICK-XXX specs in their own group.
- **Highlight Jeroen's two queues separately**, since they ask different things of him and he can clear one from his phone:
  - `awaiting-discussion`: **needs a decision.** Something is still open. For each, show the count of unresolved open questions and blocker/should-fix findings, and for a parked story, the one-line reason it parked. These need `/spec:discuss <id>` at a desk.
  - `awaiting-approval`: **needs a stamp.** Nothing is open. These need only `/spec:approve <id>`.
  Both block their downstream phases. Keep the discussion queue first: it is the one that gates everything else.
- Flag anything stuck: use `git log --follow` on each spec.md to see when its `status:` line last changed, and mark specs sitting in the same status for a long time (e.g. more than 7 days) as stale.
- **Call out a feature with several parked stories as one problem, not several.** That pattern means the feature was approved with an unresolved design question, and the fix is one conversation about the feature.

Read-only: this command changes no spec. End with a short "next actions" list, split the same way: what needs Jeroen to decide, what needs only his stamp, and which specs an agent can pick up next.
