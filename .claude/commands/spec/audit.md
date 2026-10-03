---
description: "Final review of the whole branch after all stories are done: hunt for bugs and untested functionality"
argument-hint: FEAT-XXX
---

Read `CLAUDE.md` and the referenced spec before acting.

Invoke the **final-reviewer** agent (model: fable, pass this explicitly on the Agent tool call, see `.claude/agents/final-reviewer.md`) on the feature identified in the arguments below. This is the last step of implementation, run once after all of the feature's stories are `done` (it may also be run on demand against any branch when Jeroen asks for a final sweep). It reviews the **entire branch delta** against the merge base with the default branch, committed or not, in three passes: a hostile bug hunt through the combined diff with full surrounding context, a behaviour-by-behaviour check that everything the branch adds or changes is actually exercised by a test, and a check that a human can exercise every new behaviour by hand (preferring the project's normal visible surface, with a dedicated Storybook story or docs example only for behaviour that is hard to reproduce there). It writes its findings into a **Final review** section of the feature spec, with severity, evidence, and suggested fixes, tests, or stories.

It changes no spec status and fixes nothing itself. Inside a `/spec:continue` run, the chain feeds the blockers, should-fix findings, and gap lists to the developer agent and re-audits (see that command's fix loop). Run standalone, report the findings and leave the fixes to Jeroen's call. Nice-to-have findings are documentation, never a work order.

Arguments:

$ARGUMENTS
