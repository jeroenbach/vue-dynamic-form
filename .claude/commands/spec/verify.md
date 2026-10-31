---
description: Verify an implemented story against its spec
argument-hint: ST-YY
---

Read `CLAUDE.md` and the referenced spec before acting.

Invoke the **qa-verifier** agent (model: sonnet, pass this explicitly on the Agent tool call, see `.claude/agents/qa-verifier.md`) on the story identified in the arguments below. This command also works on QUICK-XXX specs in `verifying`: the verifier checks the Proposed change and Test impact sections instead of acceptance criteria and prototype anchors. It only acts on specs with status `verifying`. It runs `pnpm ci` and the coverage check, walks every acceptance criterion with evidence, compares the implementation to the feature prototype at this story's anchors (states policy, both color modes for docs work), checks process compliance (`specs/components.md` updated, changeset present when `packages/core/src/` changed, library API rules, no silent deviations), writes the Verification report, and sets the status to `done` (pass) or back to `implementing` (fail).

Arguments:

$ARGUMENTS
