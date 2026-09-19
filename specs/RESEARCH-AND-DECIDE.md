# Research and decide: resolving open points without Jeroen

Some `/spec:*` commands are allowed to research an open point and settle it themselves instead of handing it to Jeroen. This file is the single definition of when that is allowed, how the research is done, and how the result is recorded. `/spec:discuss` and `/spec:continue` both reference it; do not restate these rules in the command files, change them here.

The purpose is to protect Jeroen's attention. He should be consulted on the calls that genuinely need him, not on questions any competent engineer could settle in ten minutes with the official docs open. The failure mode this guards against is the opposite one: quietly making a call that turns out to be a real design decision, which he then discovers only after it is built.

## What counts as an open point

In spec order:

- Every unresolved entry under **Open questions** (epics and features only).
- Every unresolved finding under **Adversarial review**, any spec type, including `PROPOSED (adversarial review)` edits Jeroen has not ruled on.
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

The same question is worth interrupting Jeroen for before he has reviewed the feature, and not worth it afterwards. Before approval he is about to read the spec anyway, so an open question costs him nothing. After approval he has deliberately stepped back, so the same question costs him a context switch into work he considers handed over.

So there are two bars, and which one applies is a fact about the spec, not a judgement call:

- **The feature is not yet approved** (chain 1, `/spec:discuss`, any epic or feature spec still short of `approved`): use the **clear-winner bar** in step 2a.
- **The feature is approved** (chain 2 and chain 3, all story prep and implementation, quick specs after approval): use the **post-approval ladder** in step 2b. Its whole purpose is to leave nothing for Jeroen.

## Step 2a: the clear-winner bar (before approval)

**Decide it yourself only when every one of these holds:**

1. The evidence points one way. Not "one option is slightly more popular", but one option is correct or clearly better on the merits and the other has a concrete disadvantage you can name.
2. It is an implementation or verification choice, invisible to a consumer of the library and to a reader of the docs site. Nothing about the public API, the documented behaviour, or what the docs/examples look like changes based on this answer.
3. It contradicts nothing already approved: the feature's design, architecture, prototype anchors, or any existing `DECIDED` entry.
4. It adds no new externally visible surface or commitment: no new dependency, export, peer dependency, setting, or breaking change, and no change to the published package's semver posture.
5. Reversing it later is a local edit, not a refactor.

**Take it to Jeroen when any one of these holds:**

- Both options are defensible and the tradeoff is a matter of priority (API ergonomics against type-safety, simplicity against flexibility, docs clarity against completeness). Equal weighing pros and cons is exactly the case he wants to keep.
- It changes the public API of `@bach.software/vue-dynamic-form` (exports, component props, slot contract, `defineMetadata` generics, validation rule behaviour), or the semver bump type is debatable.
- It touches visible design, copy, or UX of the docs site or the examples.
- It changes scope: something gets added, dropped, or deferred.
- It has further implications: it constrains a later feature, sets a pattern others will copy, or forecloses an option.
- It needs a fact only Jeroen has: account access (npm, Cloudflare, codecov), budget, a business or legal call.
- Research was inconclusive.

When in doubt, ask. A question Jeroen waves through in five seconds costs far less than a design decision made on his behalf.

## Step 2b: the post-approval tie-breaker ladder (after approval)

Once the feature is approved, "take it to Jeroen" is no longer an acceptable default. The lists in step 2a still describe what a *significant* decision looks like, but here they are a prompt to look harder, not a licence to escalate.

Research the point first, exactly as in step 1. If research produces a clear winner, record it as `DECIDED (research, <date>)` and move on. If it does not, **do not stop and do not guess**. Walk this ladder in order and take the first rung that discriminates between the options:

1. **The approved feature spec.** Its design, prototype anchors, architecture, ADRs, and existing `DECIDED` entries. Does one option follow from what was already approved, or contradict it? This rung answers more than it looks like it will, because the question usually arose from reading the spec in the first place.
2. **Upstream standards and dependency docs.** The library's validation model is XSD-inspired and it is built on vee-validate, so for rule semantics, naming, and edge-case behaviour there is usually a factual answer: the W3C XSD specification defines what a facet does, and the vee-validate and Vue docs define what the platform underneath actually guarantees (checked against this project's installed versions). A question about what `minOccurs` should mean, how whitespace collapsing works, or when validation fires is a question with an answer to go and look up, not a matter of taste.
3. **The existing codebase pattern.** `specs/components.md`, `CLAUDE.md`'s architecture and style sections, sibling specs, the existing `xsd_*` rules, the docs site's existing page structure, and the surrounding code. If this codebase already does it one way, matching it wins. Consistency is a real reason, not a tiebreak of last resort.
4. **Reversibility.** Prefer the option that is a local edit to undo over the one that is a refactor. For a published library, anything reaching the public API is by definition harder to reverse (reversing it is a breaking change), which usually settles this rung.
5. **Smallest scope.** Prefer the option that adds least: no new dependency, no new export or setting, the narrowest change that satisfies the story.

Rungs 1 to 3 produce evidence, so they record as `DECIDED (research, <date>)` with the source. Rungs 4 and 5 do not: they break a genuine tie by policy, and they record honestly as `ASSUMED (story prep, <date>)` (see step 3). Labelling those differently is what makes running unattended safe rather than reckless, because Jeroen can find every one of them at PR review and see that it was a tie rather than a finding.

**What is left after the ladder, and only this, is Jeroen's:**

1. **It needs a fact only he has:** credentials, account access, budget, a business call, or a semver judgement he explicitly wants to make himself.
2. **Answering it means contradicting something already approved:** the feature's design or architecture, or an existing `DECIDED (Jeroen, ...)` entry. Never overturn his call quietly, and never let a story locally override the feature it belongs to.
3. **The approved feature has a real gap:** neither upstream docs nor the codebase fills it, and every option changes what ships in a way he would notice, in particular any option that shapes the public API differently.

Case 3 is a defect in the **feature**, not in the story that surfaced it. Say so in those words, and name the feature section that is missing, so it gets fixed at the level where it is wrong.

## Step 2c: when it really is Jeroen's, park it, do not stop

Reaching one of those three cases post-approval does **not** halt the run. Halting punishes every other story for one story's problem, and it is exactly the interruption this file exists to prevent.

Instead:

1. Set **that one spec** to `status: awaiting-discussion`.
2. Record the item inline as `OPEN (needs Jeroen)` with the options and the tradeoff, plus one line saying which of the three cases above it is and, for case 3, which feature section is missing.
3. **Continue with the other stories.** Skip only the ones that genuinely depend on the parked one, and say which those are.
4. Name every parked spec in the closing report.

If several stories of the same feature park, do not report them as separate incidents. That pattern means the feature was approved with an unresolved design question, and the report says exactly that, because the fix is one conversation about the feature rather than several about stories.

## Step 3: record it

Write the decision back into the spec **immediately**, in place, directly under the question or finding it resolves. Do not batch them up until the end.

For a decision you made from research:

```
DECIDED (research, 2026-09-02): Validate `xsd_totalDigits` against the lexical value, not the parsed number.
Why: the XSD 1.1 spec defines totalDigits over the value space's canonical representation, and the parsed-number approach silently passes `1.10`.
Sources: w3.org/TR/xmlschema11-2/#rf-totalDigits, vee-validate docs on string-first field values (checked 2026-09-02)
```

For a post-approval tie you broke on ladder rung 4 or 5, where there was no winner on the merits:

```
ASSUMED (story prep, 2026-09-04): Expose the new setting on `DynamicFormSettings` rather than as a `DynamicForm` prop.
Why: no clear winner. The feature spec, the upstream docs, and the codebase support both.
Tie broken on: smallest scope (settings already propagate via provide/inject; a prop adds a second channel).
Alternative: a `readonly` prop on `DynamicForm`. Reversing costs a deprecation cycle on the setting.
```

Always name the alternative and what reversing it costs. An `ASSUMED` entry with no way back out is not a tie, it is a decision, and it belonged on the ladder's earlier rungs or with Jeroen.

For a decision Jeroen made, the existing convention is unchanged:

```
DECIDED (Jeroen, 2026-09-02): <the decision, in one or two sentences>
```

For something you are deliberately leaving to him:

```
OPEN (needs Jeroen): <the question, and the two or three real options with the tradeoff between them>
```

Then add or update the rollup, placed directly under the spec's H1 title so it is the first thing visible:

```markdown
## Decided without Jeroen (research)

Settled from research during <phase>, not reviewed by Jeroen. Override any of these freely.

- Q3 → totalDigits validates the lexical value
- AR-2 → drop the extra normalization pass
```

Rules for the rollup: one line per decision, linking the item id to the outcome in a handful of words. It is a skim aid, the reasoning stays inline. If Jeroen later overrides one, rewrite that entry inline as `DECIDED (Jeroen, <date>)` and remove its line from the rollup, since it is no longer a decision made without him. When the rollup empties, delete the section.

`ASSUMED` entries get their own rollup, directly under the first one, because they carry less confidence and are the ones most worth a glance at PR review:

```markdown
## Assumed without Jeroen (no clear winner)

Ties broken by policy during <phase>, not decided on the merits. Each names its alternative inline.

- Q2 → setting on DynamicFormSettings, not a prop (reversible: deprecation cycle)
```

Same rules apply: one line each, delete the section when it empties, and promote an entry to `DECIDED (Jeroen, <date>)` if he rules on it later.

If the answer changes scope, behavior, or a design or architecture call rather than merely clarifying it, edit that section of the spec too, not just the question.

## What this never does

- **Never advances `status:` frontmatter.** Status belongs to the phase commands. Researching and deciding is orthogonal to the lifecycle and moves nothing forward on its own. There is exactly one exception, and it moves nothing forward: parking a spec at `awaiting-discussion` per step 2c, which hands it back to Jeroen rather than advancing it.
- **Never sets `status: approved`,** and never suggests doing so. The three approval gates in `specs/README.md` belong to Jeroen alone, and nothing here weakens that. Settling an open point is not approving a spec.
- **Never overturns a decision Jeroen already made.** If research says an existing `DECIDED (Jeroen, ...)` entry is wrong, do not quietly revise it. Surface the conflict and let him rule.
