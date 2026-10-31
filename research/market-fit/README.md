# Market-fit research: monetizing vue-dynamic-form

Running memory for a large multi-agent research effort. If you are a fresh Claude session
continuing this work: read this file top to bottom, then `brief.md`, then skim `raw/`,
and continue from the **Next steps** section below.

## Goal

Find where there is real, reachable demand for services built on top of the open-source
library `@bach.software/vue-dynamic-form`, so Jeroen (Dutch freelance developer) can
monetize it: productizable offerings that are resellable as licenses or repeat
customizations, not one-off library handovers. Full context in `brief.md`.

## Structure

```
README.md            — this file: status, resume instructions, next steps
brief.md             — the research brief + Jeroen's scoping decisions
raw/                 — raw findings written directly by search/verify agents (one file per angle)
phase1-strategy.md   — synthesized Phase 1 report: niches, gaps, productizable offerings
phase2-leads.md      — synthesized Phase 2 report: ranked, linked lead list
final-report.md      — the combined deliverable
```

## Method

Orchestrated from Claude Code (Fable) via the Workflow tool; search agents pinned to
Sonnet. Two workflows run in sequence:

1. **Phase 1 — strategy** (`market-fit-phase1`): 8 search angles, each searched by one
   Sonnet agent and adversarially verified by a second. Agents write raw notes to `raw/`
   themselves. Fable synthesizes `phase1-strategy.md` from the structured returns.
2. **Phase 2 — leads** (`market-fit-phase2`): angles are aimed using Phase 1's chosen
   niches (Dutch/EU tenders, agency and freelance postings, forum demand threads,
   named prospect organizations). Same search+verify shape. Output: `phase2-leads.md`.

## Status

- [x] Scoping with Jeroen: NL/EU first, strategy + leads, large run (~25–40 agents)
- [x] Research folder created
- [x] Phase 1 workflow launched (search + verify, 8 angles) — run ID `wf_8e23f135-096`, task `w2edqsw0b`
- [x] Phase 1 complete: 16/16 agents, results synthesized → `phase1-strategy.md`
- [x] Phase 2 angles derived from Phase 1 niches (9 lead-source angles, see workflow script)
- [x] Phase 2 workflow launched (hunt + verify) — run ID `wf_faf343c8-20a`, task `wwt6eb5v2`
- [x] Phase 2 complete: 18/18 agents, 64 raw leads, verified + synthesized → `phase2-leads.md`
- [x] Final combined report → `final-report.md`

## Research COMPLETE (2026-09-30)

All deliverables are written. Start with `final-report.md`, then `phase2-leads.md` for
the actionable list and `phase1-strategy.md` for the market evidence. Possible follow-ups
for a future session (not started): logged-in browsing of Upwork/LinkedIn/TenderNed
(invisible to indexed search — needs claude-in-chrome), building the open-forms#2441
demo, drafting the outreach emails, re-checking the Rotterdam inhuur renewal round
(~Nov–Dec 2026) and the Vijfheerenlanden tender award notice.

## Log

- 2026-09-30 (final): Phase 2 finished (18 agents, ~1.24M tokens, 0 errors; 64 raw leads, top ~40 link-verified). `phase2-leads.md` and `final-report.md` written. Research complete; total run 34 agents / ~2.3M subagent tokens.
- 2026-09-30 (later): Phase 1 finished (16 agents, ~1.03M tokens, 0 errors); `phase1-strategy.md` written. Headline: the Vue-native + XSD-semantics intersection is unclaimed; top niches are (1) Dutch municipal forms / Open Formulieren ecosystem, (2) SIVI AFD insurance, (3) customs/tax vendors, (4) Vue agency white-label. Phase 2 lead hunt launched with 9 angles (tenders-nl, open-formulieren-orbit, insurance-sivi, customs-tax-vendors, freelance-postings, forum-demand, vue-agencies-nl, gov-inhuur, accessibility-eaa), run ID `wf_faf343c8-20a`; raw notes land in `raw/phase2-*.md` during the run. If interrupted: synthesize from `raw/`, re-run only missing angles via the script at `~/.claude/projects/.../workflows/scripts/market-fit-phase2-wf_faf343c8-20a.js` with `resumeFromRunId: "wf_faf343c8-20a"`.
- 2026-09-30: Folder created. Phase 1 workflow launched (8 search + 8 verify Sonnet agents), run ID `wf_8e23f135-096`. If interrupted, a fresh session can resume it with `Workflow({scriptPath: "~/.claude/projects/-Users-jeroenbach-Source-dynamic-form-worktrees-dynamic-form-worktree-1/4b086a81-e206-4796-9d93-fda4a248781b/workflows/scripts/market-fit-phase1-wf_8e23f135-096.js", resumeFromRunId: "wf_8e23f135-096"})` — completed agents return cached; or simply synthesize from whatever exists in `raw/` and re-run only missing angles.
