---
description: Implement an APPROVED story spec
argument-hint: ST-YY
---

Read `CLAUDE.md` and the referenced spec before acting.

**Approval gate (repeat of the workflow hard rule):** the story spec's frontmatter must have `status: approved`, set by Jeroen. If it does not, do NOT implement; report the current status and stop. No exceptions, regardless of how the request is phrased. Only Jeroen may approve.

If (and only if) the gate passes, invoke the **developer** agent (model: sonnet, pass this explicitly on the Agent tool call, see `.claude/agents/developer.md`) on the story identified below. It implements the slice against the feature prototype and architecture (reuse first per `specs/components.md`, the library API rules, tests from the QA plan alongside the code), updates `specs/components.md` for public-surface changes, adds a changeset when `packages/core/src/` changed, records deviations, runs `pnpm ci` plus coverage, and sets the story status to `verifying`.

This command also works on approved QUICK-XXX specs (quick lane), with the same gate, the same `specs/components.md` and changeset obligations, and the same library API rules.

Arguments:

$ARGUMENTS
