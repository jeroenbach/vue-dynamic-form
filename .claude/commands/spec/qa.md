---
description: Create the test plan for a story
argument-hint: ST-YY
---

Read `CLAUDE.md` and the referenced spec before acting.

Invoke the **qa-planner** agent (model: sonnet, pass this explicitly on the Agent tool call, see `.claude/agents/qa-planner.md`) on the story identified in the arguments below. It reads the story spec plus the parent feature's design and architecture sections, maps every acceptance criterion to a concrete test (unit, component, or manual) following the project's test conventions (`*.test.ts`, `*.logic.test.ts`, `*.validation.test.ts`, `*.analytics.test.ts`), lists required states from the feature's states policy, records regression risks and coverage impact, flags untestable criteria with rewrite proposals, and sets the story status to `adversarial-review`.

Arguments:

$ARGUMENTS
