---
description: Deep research run with a durable research folder; solo or fanned out over many subagents that report back
argument-hint: research question or topic
---

Read `CLAUDE.md` before acting (no em dashes in anything you write, camelCase in Vue examples, etc.).

This command runs a research project with a durable folder as running memory, an explicit build-or-delegate decision, then either solo research or phased multi-agent workflows whose agents all report back in structured form and leave raw notes on disk.

## 1. Scope with Jeroen

Refine the raw question below into a researchable brief. If any of these genuinely change how the research is aimed, ask via AskUserQuestion (2 to 4 sharp questions, recommended option first):

- Scope boundaries: geography, language, time window, market vs technical focus.
- Deliverable shape: strategy report, lead/option list, comparison, or a combination.
- Scale/budget: small (solo or a handful of agents), large (20 to 40 agents), maximum (loop-until-dry).

Do not ask about things you can decide yourself or that the question already answers.

## 2. Mode decision: solo Fable vs delegated fleet (mandatory first gate)

Before creating any workflow, explicitly evaluate whether doing the whole research yourself (Fable, inline WebSearch/WebFetch) is cheaper and better than delegating. Write the decision and its reasoning into `brief.md` (section "Mode decision").

Choose SOLO when most of these hold:

- The question decomposes into roughly 3 or fewer search angles, or the angles depend on each other (each search informs the next).
- Expected source volume fits comfortably in one context (roughly under 30 to 40 fetched pages).
- Judgment quality matters more than coverage: nuanced weighing, a buy-vs-build call, a comparison with few candidates.
- Speed of iteration with Jeroen matters (he is present and steering).

Solo advantages to weigh: no duplicated context across agents, full continuity of reasoning, Fable-level judgment on every source, typically 5 to 10x fewer tokens. Solo limits: one context window caps breadth, and there is no independent adversarial verification unless you spawn at least a couple of verifier agents.

Choose DELEGATED when most of these hold:

- 5+ genuinely independent search angles (different sources, languages, or communities that do not inform each other).
- Coverage matters: the cost of missing a vein is higher than the cost of extra tokens.
- Claims need adversarial verification by agents that did not produce them.
- Total reading volume exceeds what one context can hold.

Hybrid is allowed and often right: solo scouting to discover the angle list, then delegate the fan-out; or delegate the search but verify the top 5 claims yourself.

## 3. Create the research folder (always, in both modes)

Create `research/<kebab-slug>/` with:

- `README.md`: purpose (one paragraph), structure listing, method summary, a status checklist, resume instructions written for a fresh session that knows nothing ("read this file, then brief.md, then skim raw/, continue from Next steps"), and a dated log. Every workflow launch gets its run ID and resume command logged here immediately.
- `brief.md`: the refined question, Jeroen's scoping answers (dated), the mode decision with reasoning, and the angle table (key + focus per angle).
- `raw/`: empty; agents (or you, in solo mode) write per-angle notes here as work happens, not at the end. This is the insurance against token exhaustion: findings must land on disk continuously.

Update README status and log after every phase. If a session dies, `raw/` is the source of truth; re-run only angles whose files are missing or empty.

## 4. Solo mode procedure

Work angle by angle. After each angle, write `raw/<angle>.md` (URLs, quotes, numbers, dead ends) before starting the next. Verify load-bearing claims against independent sources yourself, or spawn 1 to 3 cheap verifier agents for the claims your conclusions hinge on. Then synthesize per section 6.

## 5. Delegated mode procedure

Design one Workflow per phase (do not chain phases inside a single workflow; synthesize and re-aim between phases). Rules:

- **Angles**: 6 to 10 per phase, each a genuinely different source class or question, listed in `brief.md` first.
- **Shared context block**: every agent prompt starts with the same CONTEXT constant: what the subject is, what its distinguishing properties are, the business goal, geography/language, today's date, and what a good finding/lead looks like. Agents fail on vague context, not on vague instructions.
- **Model mix**: search/hunt agents on `model: 'sonnet'`; verifiers on sonnet with `effort: 'low'` or `'medium'`; synthesis is done by the orchestrator (you), not an agent.
- **Durable notes**: every agent prompt must instruct: "BEFORE returning, use the Write tool to save full raw notes (all URLs, quotes, dead ends) to `<abs-path>/raw/<phase>-<key>.md`". Verifiers write `...-verify.md`.
- **Structured returns**: give every agent a JSON schema. Search agents return summary + findings (claim, url, source, confidence, loadBearing) + opportunities/leads + a dryWells list (searches that yielded nothing, so they are not repeated). Lead agents return per-lead: title, organization, url, type, date, fit score 1 to 5, why, nextAction.
- **Verify stage**: pipeline (not barrier) each search agent into an adversarial verifier that tries to REFUTE its load-bearing and low-confidence claims with independent sources, verdicts confirmed/unverified/refuted (or live/stale/broken/misdescribed for leads). Only confirmed material may be stated as fact in reports; refutations go into a corrections log.
- **Tooling note for agents**: tell them to load WebSearch/WebFetch via ToolSearch first, to fetch pages rather than trust snippets, to search Dutch and English where relevant, and that GitHub's REST API often beats WebSearch for issue/discussion hunting. Warn that Upwork/LinkedIn/TenderNed are login-walled and invisible to indexed search.
- Log the run ID and resume command (`resumeFromRunId`) in README the moment the workflow launches.

## 6. Synthesis (orchestrator, after each phase)

Read the full structured output (paginate; do not synthesize from the truncated notification). Write `<phase>-report.md` in the research folder:

- Lead with the one-sentence conclusion, then verified findings with inline links.
- Incorporate verifier corrections into the text and keep an explicit "Corrections log" section listing every refuted claim so it is never reused.
- Rank results by an explicit formula stated in the report (for example, for a market-fit hunt: demand evidence x fit x reachability). Choose the factors that match this research's goal and state them.
- Distinguish verified facts, vendor self-claims, and absence-of-evidence signals.

## 7. Later phases

Aim each next phase with the previous phase's conclusions (broad mapping first, targeted hunting second is the usual shape). Repeat sections 5 and 6. Finish with `final-report.md`: thesis in a few sentences, the recommended play in ordered steps, caveats, and a concrete first-week action table. Mark the README status COMPLETE with dated follow-up suggestions for future sessions.

## 8. Reporting back to Jeroen

After each phase, give a TLDR in chat: the headline finding first, then the two or three most decision-relevant results, then what launched next. Never make Jeroen read the folder to learn the outcome; the folder is the archive, the chat message is the deliverable of the moment. Do not commit anything; Jeroen handles git.
