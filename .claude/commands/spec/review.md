---
description: "Adversarial review: full for features, lite for stories and quick specs"
argument-hint: FEAT-XXX or ST-YY or QUICK-XXX
---

Read `CLAUDE.md` and the referenced spec before acting.

Invoke the **adversarial-reviewer** agent (model: opus, pass this explicitly on the Agent tool call, see `.claude/agents/adversarial-reviewer.md`) on the spec identified in the arguments below, in the mode matching the spec type:

- FEAT-XXX: FEATURE mode (full): attack functional scope, public API and semver claims, validation semantics, reactivity, design, and cross-cutting cohesion.
- ST-YY or QUICK-XXX: STORY mode (lite): blockers only, meaning testable acceptance criteria mapped in the QA plan, consistency with the approved feature design/architecture, explicit dependencies.

The reviewer writes findings with severities in the spec's Adversarial review section, routes blockers/should-fixes as "PROPOSED (adversarial review)" edits in the relevant sections, then sets the status mechanically: `awaiting-discussion` if an Open question is unresolved, a blocker is unresolved, or a should-fix is unresolved with no PROPOSED edit written for it; `awaiting-approval` otherwise. In practice a FEATURE review lands in the first and a clean STORY or QUICK review in the second. After that, only Jeroen decides.

Arguments:

$ARGUMENTS
