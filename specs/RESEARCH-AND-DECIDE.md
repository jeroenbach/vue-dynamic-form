# Research and decide: resolving open points without the maintainer

Some `/spec:*` commands are allowed to research an open point and settle it themselves instead of handing it to the maintainer. This file is the single definition of when that is allowed, how the research is done, and how the result is recorded. `/spec:discuss` and `/spec:continue` both reference it; do not restate these rules in the command files, change them here.

The purpose is to protect the maintainer's attention. They should be consulted on the calls that genuinely need them, not on questions any competent engineer could settle in ten minutes with the official docs open. The failure mode this guards against is the opposite one: quietly making a call that turns out to be a real design decision, which they then discover only after it is built.

## What counts as an open point

In spec order:

- Every unresolved entry under **Open questions** (epics and features only).
- Every unresolved finding under **Adversarial review**, any spec type, including `PROPOSED (adversarial review)` edits the maintainer has not ruled on.
- Anything flagged as unresolved or a gap in a story's QA plan or Implementation notes.

If there are none, say so plainly. Never manufacture questions to have something to research.

## Step 1: research before judging

Research first, then decide whether it is yours to settle. Judging "is there a clear winner" before looking is guessing.

- Go to primary sources: MDN, the official Vue / vee-validate / VitePress / Storybook / Vitest docs, the W3C XML Schema (XSD) specification for anything about `xsd_*` rule semantics, the actual library repo, changelog, or issue tracker. Blog posts and Stack Overflow answers are leads, not evidence, and they go stale.
- Check the claim against **this project's actual versions**, not the latest release. Read `package.json` and `pnpm-lock.yaml` before asserting that an API exists or a bug is fixed. This is a pnpm monorepo: `docs/` and `playgrounds/storybook/` have their own lockfiles and dependency sets, separate from the workspace.
- Note how current the source is. A stale browser support table or a "this is not supported yet" answer is frequently wrong by now.
- Check the repo before the web when the question is about this codebase: `specs/components.md`, `CLAUDE.md`'s Architecture section, existing specs, the docs site content under `docs/`, the Storybook stories, and the surrounding code often already answer it.
- For anything about Claude models, the Claude API, or the Anthropic SDK, load the `claude-api` skill rather than answering from memory.

If research comes back inconclusive, or the sources disagree, that is itself a "no clear winner" result. What happens next depends on whether the feature is approved yet, which is the subject of the next two steps.

## Step 2: the bar moves once the feature is approved

The same question is worth interrupting the maintainer for before they have reviewed the feature, and not worth it afterwards. Before approval they are about to read the spec anyway, so an open question costs them nothing. After approval they have deliberately stepped back, so the same question costs them a context switch into work they consider handed over.

So there are two bars, and which one applies is a fact about the spec, not a judgement call:

- **The feature is not yet approved** (chain 1, `/spec:discuss`, any epic or feature spec still short of `approved`): use the **clear-winner bar** in step 2a. Chain 1 runs this research step right after the adversarial review, so the spec reaches the maintainer with the clear winners already settled; `/spec:discuss` then opens by presenting those decisions for them to override and researches only what the chain missed. Pre-approval, never write `ASSUMED` entries and never break ties: what fails the bar simply stays open for the discussion.
- **The feature is approved** (chain 2 and chain 3, all story prep and implementation, quick specs after approval): use the **post-approval ladder** in step 2b. Its whole purpose is to leave nothing for the maintainer.

## Step 2a: the clear-winner bar (before approval)

**Decide it yourself only when every one of these holds:**

1. The evidence points one way. Not "one option is slightly more popular", but one option is correct or clearly better on the merits and the other has a concrete disadvantage you can name.
2. It is an implementation or verification choice, invisible to a consumer of the library and to a reader of the docs site. Nothing about the public API, the documented behaviour, or what the docs/examples look like changes based on this answer.
3. It contradicts nothing already approved: the feature's design, architecture, prototype anchors, or any existing `DECIDED` entry.
4. It adds no new externally visible surface or commitment: no new dependency, export, peer dependency, setting, or breaking change, and no change to the published package's semver posture.
5. Reversing it later is a local edit, not a refactor.

**Take it to the maintainer when any one of these holds:**

- Both options are defensible and the tradeoff is a matter of priority (API ergonomics against type-safety, simplicity against flexibility, docs clarity against completeness). Equal weighing pros and cons is exactly the case the maintainer wants to keep.
- It changes the public API of `@bach.software/vue-dynamic-form` (exports, component props, slot contract, `defineMetadata` generics, validation rule behaviour), or the semver bump type is debatable.
- It touches visible design, copy, or UX of the docs site or the examples.
- It changes scope: something gets added, dropped, or deferred.
- It has further implications: it constrains a later feature, sets a pattern others will copy, or forecloses an option.
- It needs a fact only the maintainer has: account access (npm, Cloudflare, codecov), budget, a business or legal call.
- Research was inconclusive.

When in doubt, ask. A question the maintainer waves through in five seconds costs far less than a design decision made on their behalf.

## Step 2b: the post-approval tie-breaker ladder (after approval)

Once the feature is approved, "take it to the maintainer" is no longer an acceptable default. The lists in step 2a still describe what a *significant* decision looks like, but here they are a prompt to look harder, not a licence to escalate.

Research the point first, exactly as in step 1. If research produces a clear winner, record it as `DECIDED (research)` and move on. If it does not, **do not stop and do not guess**. Walk this ladder in order and take the first rung that discriminates between the options:

1. **The approved feature spec.** Its design, prototype anchors, architecture, ADRs, and existing `DECIDED` entries. Does one option follow from what was already approved, or contradict it? This rung answers more than it looks like it will, because the question usually arose from reading the spec in the first place.
2. **Upstream standards and dependency docs.** The library's validation model is XSD-inspired and it is built on vee-validate, so for rule semantics, naming, and edge-case behaviour there is usually a factual answer: the W3C XSD specification defines what a facet does, and the vee-validate and Vue docs define what the platform underneath actually guarantees (checked against this project's installed versions). A question about what `minOccurs` should mean, how whitespace collapsing works, or when validation fires is a question with an answer to go and look up, not a matter of taste.
3. **The existing codebase pattern.** `specs/components.md`, `CLAUDE.md`'s architecture and style sections, sibling specs, the existing `xsd_*` rules, the docs site's existing page structure, and the surrounding code. If this codebase already does it one way, matching it wins. Consistency is a real reason, not a tiebreak of last resort.
4. **Reversibility.** Prefer the option that is a local edit to undo over the one that is a refactor. For a published library, anything reaching the public API is by definition harder to reverse (reversing it is a breaking change), which usually settles this rung.
5. **Smallest scope.** Prefer the option that adds least: no new dependency, no new export or setting, the narrowest change that satisfies the story.

Rungs 1 to 3 produce evidence, so they record as `DECIDED (research)` with the source. Rungs 4 and 5 do not: they break a genuine tie by policy, and they record honestly as `ASSUMED (story prep)` (see step 3). Labelling those differently is what makes running unattended safe rather than reckless, because the maintainer can find every one of them at PR review and see that it was a tie rather than a finding.

**What is left after the ladder, and only this, is the maintainer's:**

1. **It needs a fact only the maintainer has:** credentials, account access, budget, a business call, or a semver judgement they explicitly want to make themselves.
2. **Answering it means contradicting something already approved:** the feature's design or architecture, or an existing `DECIDED (maintainer, ...)` entry. Never overturn their call quietly, and never let a story locally override the feature it belongs to.
3. **The approved feature has a real gap:** neither upstream docs nor the codebase fills it, and every option changes what ships in a way the maintainer would notice, in particular any option that shapes the public API differently.

Case 3 is a defect in the **feature**, not in the story that surfaced it. Say so in those words, and name the feature section that is missing, so it gets fixed at the level where it is wrong.

## Step 2c: when it really is the maintainer's, park it, do not stop

Reaching one of those three cases post-approval does **not** halt the run. Halting punishes every other story for one story's problem, and it is exactly the interruption this file exists to prevent.

Instead:

1. Set **that one spec** to `status: awaiting-discussion`.
2. Record the item inline as `OPEN (needs maintainer)` with the options and the tradeoff, plus one line saying which of the three cases above it is and, for case 3, which feature section is missing.
3. **Continue with the other stories.** Skip only the ones that genuinely depend on the parked one, and say which those are.
4. Name every parked spec in the closing report.

If several stories of the same feature park, do not report them as separate incidents. That pattern means the feature was approved with an unresolved design question, and the report says exactly that, because the fix is one conversation about the feature rather than several about stories.

## Step 2d: the auto-mode bar (only under /spec:auto, on a spec flagged `auto: true`)

When the maintainer has put a spec in auto mode (they typed `/spec:auto <id>`, which stamped `auto: true` in its frontmatter; see `specs/README.md`), they have delegated their gates for that spec and asked for best judgment instead of questions. One bar then applies at **every** phase, pre- and post-approval alike:

1. Research first, exactly as step 1. A clear winner records as `DECIDED (research)`.
2. No clear winner: walk the post-approval ladder of step 2b. Rungs 1 to 3 record as `DECIDED (research)`; rungs 4 and 5 record as `ASSUMED (auto)`, same format as `ASSUMED (story prep)`, naming the alternative and the reversal cost.
3. The ladder does not discriminate and the call would normally go to the maintainer (a real tradeoff, public API shape, visible design, scope): make the best call anyway and record it as `DECIDED (auto)`, with the reasoning, the alternative considered, and what reversing it would cost. These entries are the core of what they audit at PR review, so they must be findable: keep them in the rollups.
4. A feature gap surfaced by a story (step 2b's case 3) is fixed by amending the feature spec, noted in the spec's Auto mode log, instead of parking.

Two cases survive even this bar, because no delegation can conjure them, and they park per step 2c:

- It needs a fact only the maintainer has: credentials, account access, budget, a business call.
- Settling it means overturning an explicit `DECIDED (maintainer)` entry or content they personally approved. Their recorded calls are never overridden silently, in any mode.

`DECIDED (auto)` and `ASSUMED (auto)` entries get one-line rollup entries in the same two rollup sections defined in step 3 (they are decisions and assumptions made without the maintainer, which is exactly what those sections collect). Outside a `/spec:auto` run this step never applies: the flag alone changes nothing for `/spec:continue`, `/spec:discuss`, or any agent.

## Step 3: record it

Write the decision back into the spec **immediately**, in place, directly under the question or finding it resolves. Do not batch them up until the end.

**Never record a date on any entry.** No `DECIDED (research, 2026-…)`, no "checked <date>" on a source, no `created:` frontmatter. Git already tracks when every line was written; a second, hand-typed date only diverges from it. Record *that* the decision was made and by whom (research, story prep, or the maintainer), never *when*.

For a decision you made from research:

```
DECIDED (research): Validate `xsd_totalDigits` against the lexical value, not the parsed number.
Why: the XSD 1.1 spec defines totalDigits over the value space's canonical representation, and the parsed-number approach silently passes `1.10`.
Sources: w3.org/TR/xmlschema11-2/#rf-totalDigits, vee-validate docs on string-first field values
```

For a post-approval tie you broke on ladder rung 4 or 5, where there was no winner on the merits:

```
ASSUMED (story prep): Expose the new setting on `DynamicFormSettings` rather than as a `DynamicForm` prop.
Why: no clear winner. The feature spec, the upstream docs, and the codebase support both.
Tie broken on: smallest scope (settings already propagate via provide/inject; a prop adds a second channel).
Alternative: a `readonly` prop on `DynamicForm`. Reversing costs a deprecation cycle on the setting.
```

Always name the alternative and what reversing it costs. An `ASSUMED` entry with no way back out is not a tie, it is a decision, and it belonged on the ladder's earlier rungs or with the maintainer.

For a decision the maintainer made, the existing convention is unchanged:

```
DECIDED (maintainer): <the decision, in one or two sentences>
```

For something you are deliberately leaving to the maintainer:

```
OPEN (needs maintainer): <the question, and the two or three real options with the tradeoff between them>
```

Then add or update the rollup, placed directly under the spec's H1 title so it is the first thing visible:

```markdown
## Decided without the maintainer (research)

Settled from research during <phase>, not reviewed by the maintainer. Override any of these freely.

- Q3 → totalDigits validates the lexical value
- AR-2 → drop the extra normalization pass
```

Rules for the rollup: one line per decision, linking the item id to the outcome in a handful of words. It is a skim aid, the reasoning stays inline. If the maintainer later overrides one, rewrite that entry inline as `DECIDED (maintainer)` and remove its line from the rollup, since it is no longer a decision made without them. When the rollup empties, delete the section.

`ASSUMED` entries get their own rollup, directly under the first one, because they carry less confidence and are the ones most worth a glance at PR review:

```markdown
## Assumed without the maintainer (no clear winner)

Ties broken by policy during <phase>, not decided on the merits. Each names its alternative inline.

- Q2 → setting on DynamicFormSettings, not a prop (reversible: deprecation cycle)
```

Same rules apply: one line each, delete the section when it empties, and promote an entry to `DECIDED (maintainer)` if they rule on it later.

If the answer changes scope, behavior, or a design or architecture call rather than merely clarifying it, edit that section of the spec too, not just the question.

## What this never does

- **Never advances `status:` frontmatter.** Status belongs to the phase commands. Researching and deciding is orthogonal to the lifecycle and moves nothing forward on its own. There is exactly one exception, and it moves nothing forward: parking a spec at `awaiting-discussion` per step 2c, which hands it back to the maintainer rather than advancing it.
- **Never sets `status: approved`,** and never suggests doing so. The three approval gates in `specs/README.md` belong to the maintainer, and nothing here weakens that. Settling an open point is not approving a spec. The one sanctioned way a gate is crossed without their stamp is the per-spec delegation they grant by typing `/spec:auto <id>` (defined in `specs/README.md`); even then the approval is performed by that command's gate-crossing step, never by this research step.
- **Never overturns a decision the maintainer already made.** If research says an existing `DECIDED (maintainer, ...)` entry is wrong, do not quietly revise it. Surface the conflict and let them rule.
