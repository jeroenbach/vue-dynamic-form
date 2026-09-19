---
id: ST-05
type: story
feature: FEAT-002
status: approved
created: 2026-09-17
approved_by: Jeroen
pr: ""
---

# Story: Docs — interleaved ordering demo (`displayOrder` + `preserveOrder`)

## Functional
### User story
As a docs reader evaluating whether to interleave a repeatable explicit choice's occurrences by add-order, I want a live, runnable demo that lets me flip between grouped and interleaved display and toggle a persist-on-reload mode, with the submitted-values JSON visible, so that I can see the trade-off between the two tiers and copy whichever pattern fits my use case.

### Acceptance criteria

1. **A demo toolbar hosts a display-order control and a `preserveOrder` toggle.**
   Given the `FormExampleChoiceExplicitRepeatable` demo (already updated by ST-04 with continuous numbering),
   When this story ships,
   Then it gains a toolbar with a segmented "Grouped by kind | Order added" control (mapped to the `displayOrder` metadata flag) and a `preserveOrder` `ToggleSwitch`, hosted in `ChoiceArraySectionCard.vue` and/or the example component per the prototype's `#ordering-toolbar` layout.

   > PROPOSED (adversarial review, finding 2): host the toolbar in `FormExampleChoiceExplicitRepeatable.vue` (the example component), not unconditionally inside `ChoiceArraySectionCard.vue`. Confirmed directly that `ChoiceArraySectionCard.vue` is the shared fallback every repeatable explicit choice renders through: `AdvancedFormTemplate.vue`'s `heading-choice-array` slot (lines 192-205) instantiates it unconditionally. Rendering the toolbar unconditionally inside that card would leak the demo chrome into every current and future repeatable explicit choice example in the docs site, not just this one demo. If the toolbar must live inside the card for layout reasons, gate it behind an explicit opt-in prop/slot that only this example sets, never a default-on render. Rewrite the AC's "hosted in `ChoiceArraySectionCard.vue` and/or the example component" to "hosted by the example component (or gated behind an opt-in prop on the shared card), never rendered unconditionally in the shared `ChoiceArraySectionCard.vue`".

2. **Flipping either control remounts the choice with the new static flag (ADR-5/ADR-6).**
   Given a reader flips the display-order segmented control or the `preserveOrder` toggle,
   When the flip happens,
   Then the example re-keys (`:key`) the relevant metadata/form so the choice remounts with `displayOrder`/`preserveOrder` set to the new value (both are static, setup-captured flags per ST-02/ST-03, not reactive), and the docs prose states plainly that this remount wipes the session's ephemeral `insertionOrder` click history, the same documented fallback shown at `#ordering-interleaved`.

   > PROPOSED (adversarial review, finding 1): resolve the "relevant metadata/form" ambiguity to match the feature's decided mechanism, and specify the value-survival step the interaction script silently depends on. The feature decided re-key the FORM (ADR-6: "re-keys (`:key`) the form when the toggle flips, so it remounts cleanly"; design decision 3's Q8 note likewise). A bare `:key` bump on the form remounts `useForm`, which re-initialises from `initialValues` and therefore WIPES all entered occurrence field data, directly contradicting the QA plan's interaction script (steps 4b, 6b, 9) and the off-then-on edge case, both of which require field data to survive while only ordering state resets. So the example must, on every flip: (1) snapshot the current `values`; (2) when turning `preserveOrder` OFF, strip the `order` key from that snapshot (otherwise the re-seeded values keep `order` and step 9's "the JSON dump loses the `order` key entirely" fails, because the engine with `preserveOrder` off never removes a pre-existing `order`); (3) bump the form `:key`; (4) pass the (possibly stripped) snapshot as `initialValues` to the remounted form. On a `preserveOrder` OFF->ON flip the seed carries no `order`, so ST-03's mount-time backfill (AR-2) assigns `order` from grouped position, matching step 6. Reword AC2 to "re-keys the form (per ADR-6) and re-seeds the current values as `initialValues` so entered field data survives the remount, stripping the `order` key from the seed when `preserveOrder` is turned off, while the instance-local ephemeral `insertionOrder` history is wiped by the remount". This is example-level wiring, not an engine change; it stays inside this docs story's scope.

3. **Grouped mode matches ST-04's baseline exactly.**
   Given `displayOrder` absent/`'grouped'` (the toolbar's default state),
   When occurrences are added,
   Then they render in the same grouped order and continuous badge as ST-04, with no `order` key in the values JSON (`preserveOrder` also defaults off).

4. **Add-order mode without `preserveOrder` interleaves visually, with a reload caveat.**
   Given the segmented control set to "Order added" and `preserveOrder` off,
   When "CRM export", then "API endpoint", then a second "CRM export" are added, in that click order,
   Then the cards render in that same click order (interleaved, not grouped), the values JSON shows no `order` key anywhere, and an amber callout states that this order does not survive a reload/remount (falls back to grouped), matching `#ordering-interleaved` and the ephemeral half of `#reload-behavior`.

5. **Add-order mode with `preserveOrder` on persists and compacts.**
   Given the segmented control set to "Order added" and `preserveOrder` on,
   When the same three occurrences are added,
   Then each occurrence's own values object in the JSON dump shows an `order` key with its numeric value matching click order, and removing the second-added occurrence compacts the survivors' `order` to a contiguous 1..N, visibly changing in the JSON dump, matching `#ordering-preserve`, `#ordering-removal`, and `#ordering-values`.

6. **`docs/examples/choices.md` documents both tiers and the reload trade-off.**
   Given the "Add several" section (as left by ST-04),
   When this story ships,
   Then it gains prose covering: the `displayOrder` flag and its two values, the `insertionOrder` slot prop and its ephemeral/never-in-`values` nature, the `preserveOrder` flag and the resulting `order` field in submitted values, the reload trade-off stated side by side (ephemeral falls back to grouped; persisted reconstructs exactly), and the ADR-3 constraints (object-branch-only; a branch with a child literally named `order` collides, documented as the consumer's responsibility to avoid or not opt in).

7. **`docs/reference/field-metadata.md` documents the two new flags.**
   Given the existing `explicitChoiceSelection`/`preserveOnSwitch` reference entries,
   When this story ships,
   Then `displayOrder` and `preserveOrder` each gain a matching entry (type, default, one-line pointer to the choices example section), placed near the other choice-related flags.

### Edge cases
- The optional `seq-chip` teaching aid (design decision 4, showing the raw `insertionOrder`/`order` value on each card): if included, the surrounding prose marks it explicitly as a teaching aid, not shipped library UI, matching the prototype's own framing.
- A reader toggles `preserveOrder` on, adds occurrences, toggles it off (values JSON loses `order`, per the remount), then back on: the JSON's `order` values restart from a fresh counter after the remount rather than resuming the earlier sequence; the docs prose states this honestly rather than implying continuity across flips.
- The shared occurrence budget / per-branch `maxOccurs` limits (already demonstrated pre-FEAT-002) continue to disable the relevant Add button regardless of which toolbar state is active, matching `#states-limits`.

### Out of scope
- Any `DynamicFormSettings` surface: none ships (Q8 decided against it); this demo only ever sets per-choice `FieldMetadata` flags.
- Any Storybook story: not planned for this feature (Q7, decided).
- Any change to the engine (`packages/core/src/`): this story is docs-only, building entirely on ST-02 and ST-03's already-shipped primitives.

## Design reference
Feature prototype (`../../prototype.html`): `#ordering-toolbar` (segmented control + `preserveOrder` toggle, default/focus/on states), `#ordering-grouped`, `#ordering-interleaved`, `#ordering-preserve`, `#ordering-values` (live JSON dump, `order` key highlighted when present), `#ordering-removal`, `#reload-behavior` (both tiers side by side), `#states-error` (inherited `xsd_choiceMinOccurs`, unchanged), `#states-limits` (Add buttons disabled at budget), `#docs-impact` (summary of what changed). The toolbar itself is docs-demo chrome per the feature design, not a shipped library component; its two controls may be plain inputs rather than a dedicated reusable component if the implementer prefers, per the feature architecture's note that no new library-shipped visual component is genuinely needed.

## Architecture reference
Docs-only slice; touches no `packages/core/src/` file, so no changeset. Builds on ST-02 (ephemeral `insertionOrder`/`displayOrder`), ST-03 (persisted `preserveOrder`), and ST-04 (the already-converted example page and continuous-numbering badge this story adds the toolbar on top of).

- **`docs/.vitepress/theme/components/ChoiceArraySectionCard.vue` and/or `FormExampleChoiceExplicitRepeatable.vue` (modified).** Host the demo toolbar (segmented display-order control, `preserveOrder` `ToggleSwitch`); the example component sets `displayOrder`/`preserveOrder` on the choice's metadata and re-keys the form/metadata when either control flips (ADR-5/ADR-6 mechanism: both flags are static, so a runtime toggle is realized as a remount, not a reactive prop).

  > PROPOSED (adversarial review, findings 1 and 2): (a) the toolbar is hosted by `FormExampleChoiceExplicitRepeatable.vue`, not rendered unconditionally in `ChoiceArraySectionCard.vue` (a shared card instantiated by every repeatable explicit choice via `AdvancedFormTemplate.vue`'s `heading-choice-array` slot, lines 192-205); if it must sit inside the card it is gated behind an opt-in prop this example alone sets. (b) The re-key targets the FORM (ADR-6), and the example snapshots current `values` and re-seeds them as `initialValues` on the remount so entered field data survives, stripping the `order` key from the seed when `preserveOrder` is turned off. Without (b) the remount wipes all field data, breaking the QA interaction script (steps 4b/6b/9) and the off-then-on edge case. See AC1/AC2 for the full rationale.
- **`docs/examples/choices.md` (modified).** New prose and snippet additions per the acceptance criteria above, appended to/extending the "Add several" section ST-04 already updated.
- **`docs/reference/field-metadata.md` (modified).** New `displayOrder` and `preserveOrder` entries, following the existing `explicitChoiceSelection`/`preserveOnSwitch` entry format and placement precedent.
- **Public API surface touched:** none (documents ST-02/ST-03's already-shipped surface; adds no new library export).
- **Dependencies:** ST-02 (ephemeral tier + `displayOrder`), ST-03 (persisted tier), ST-04 (the docs example this story's toolbar is added to, and the continuous-numbering badge shown alongside the ordering demo).
- **`specs/components.md`:** no change (docs-only; ST-02/ST-03 already own those entries).

## QA plan

This is a docs-only slice (Slice D2): no `packages/core/src/` file changes, no changeset. Confirmed directly (no `describe(`/`it(` anywhere under `docs/.vitepress/theme/`; grep across `docs/` finds `@vue/test-utils`-style tests nowhere outside `docs/examples/*.md`/`docs/guide/*.md` prose mentions) that, exactly as FEAT-001 ST-04 established for this class of story, no automated component-test harness exists for `docs/.vitepress/theme` components. Verification is therefore mechanical (`pnpm docs:build`, `grep`), editorial (manual prose read against the acceptance criteria and the prototype), and manual/visual (Playwright screenshots per prototype anchor in both VitePress color modes, plus a scripted click-through interaction, since AC2, AC4, and AC5's core claims — remount-on-flip, interleave-without-persistence, compaction-with-persistence — are runtime behaviors only a live browser session can demonstrate; no grep or build check can prove a remount happened or that a JSON key changed value after a click).

Unlike ST-01-ST-03 (engine stories) this plan adds no `*.logic.test.ts`/`*.analytics.test.ts`/`*.validation.test.ts` content and pins no render-count contract: the engine mechanisms this story's demo exercises (`renderedChoiceOccurrences`'s sort, `insertionOrder` assignment, `order` write/compaction/backfill) are already fully pinned by ST-02's and ST-03's own test suites. This story's manual script is an end-to-end sanity check that the docs demo wires those primitives correctly, not a substitute for or a duplicate of that coverage.

### Fixture / harness changes

None. No new test helper, testid, or fixture component is introduced; the demo toolbar and JSON dump are read visually, not through a test harness. `FormExampleChoiceExplicitRepeatable.vue`'s existing `<pre>` JSON dump (already present, see `docs/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue`) is the read surface for every values-shape claim below (AC3-AC5, the edge cases); no new dump element is required.

### Baseline fixture note

`FormExampleChoiceExplicitRepeatable.vue`'s metadata declares `crmExport` before `apiEndpoint` (confirmed directly in the current file). Per the coordination note this plan was given (ST-04's adversarial review settled that docs-story grouped-order literals are `crmExport`-first, matching this fixture, unlike the engine test suite's `apiEndpoint`-first fixture), every grouped-order example below is stated `crmExport`-first: grouped order for a mixed add sequence is `crmExport` occurrences before `apiEndpoint`'s, regardless of click order.

### Files touched

| File | Change |
| --- | --- |
| `docs/.vitepress/theme/components/ChoiceArraySectionCard.vue` and/or `docs/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue` | Hosts the demo toolbar (segmented `displayOrder` control + `preserveOrder` `ToggleSwitch`); wires the re-key-on-flip mechanism (ADR-5/ADR-6). Covers AC1, AC2. |
| `docs/examples/choices.md` | New prose extending the existing "Add several, each one of several kinds" section (after line 175's live example, before "Capping a branch's total count"): both ordering tiers, the reload trade-off stated side by side, the `order`-in-values shape, the ADR-3 object-branch/reserved-key constraints. Covers AC3-AC6. |
| `docs/reference/field-metadata.md` | Two new entries, `displayOrder` and `preserveOrder`, placed immediately after the existing `### explicitChoiceSelection` entry (line 225) and before `### attributes` (line 242), matching that entry's own placement precedent (a modifier flag directly after the structural property/sibling flag it extends). Covers AC7. |

### Acceptance criteria → check mapping

1. **A demo toolbar hosts a display-order control and a `preserveOrder` toggle.**
   - Visual/manual: compare the rendered toolbar against prototype anchor `#ordering-toolbar` (default, focus, and "on" states) in both light and dark VitePress color modes; confirm a segmented "Grouped by kind | Order added" control and a `ToggleSwitch`-based `preserveOrder` toggle are both present and visually match the prototype's layout intent (exact markup is the implementer's call per the Design reference's "plain inputs" allowance).
   - Mechanical: `grep -n "displayOrder\|preserveOrder" docs/.vitepress/theme/components/ChoiceArraySectionCard.vue docs/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue` — at least one of the two files must reference both flags, confirming the toolbar is actually wired to metadata rather than being static/decorative chrome.
   - Editorial: confirm the toolbar is scoped to this one example's own component tree (see Regression risk below for why `ChoiceArraySectionCard.vue` is the higher-risk host).

2. **Flipping either control remounts the choice with the new static flag (ADR-5/ADR-6).**
   - Manual/scripted (see the Manual verification checklist's interaction script below): flip each control independently and confirm (a) the newly selected `displayOrder`/`preserveOrder` value takes visible effect immediately, (b) already-entered occurrence field data (e.g. a typed "CRM system" value) survives the flip, and (c) the session's ephemeral add-press history is wiped by the flip (an ephemeral-tier display that was showing add-order before the flip falls back to grouped order immediately after, per the documented fallback at `#ordering-interleaved`).
   - Editorial: `docs/examples/choices.md` states plainly, in prose, that flipping either control remounts the choice and wipes the ephemeral `insertionOrder` history; cross-check the wording against this story's own AC2 clause and against ST-02's documented reload fallback so the docs page does not overstate persistence the ephemeral tier does not have.
   - Mechanical: `grep -n "remount\|re-key\|:key" docs/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue docs/.vitepress/theme/components/ChoiceArraySectionCard.vue` — confirms a `:key` binding actually exists on the relevant node (a purely reactive/prop-driven toggle with no remount would silently fail this AC even if the JSON output happened to look right by coincidence of ST-02/ST-03's own internals).

3. **Grouped mode matches ST-04's baseline exactly.**
   - Manual/visual: with the toolbar at its default (Grouped, `preserveOrder` off), add "CRM export", "API endpoint", "CRM export" in that click order; confirm the cards render `crmExport, crmExport, apiEndpoint` (grouped, `crmExport`-first per the Baseline fixture note above) with continuous badges 1, 2, 3, byte-identical in ordering and numbering to ST-04's own AC3/AC4 behavior (re-run ST-04's own manual check as a regression, not a new claim).
   - Manual/visual: inspect the JSON dump (`<pre>`) and confirm no `order` key appears anywhere in any occurrence's values object.
   - Editorial: confirm no prose contradicts ST-04's existing "Add several" baseline text (additive-only diff check, mirroring FEAT-001 ST-04's regression-risk technique).

4. **Add-order mode without `preserveOrder` interleaves visually, with a reload caveat.**
   - Manual/scripted: with the toolbar set to "Order added" and `preserveOrder` off, add "CRM export", then "API endpoint", then a second "CRM export" (fresh session, no prior remount); confirm the cards render in that same click order (`crmExport, apiEndpoint, crmExport`, interleaved), matching `#ordering-interleaved`.
   - Manual/visual: confirm the JSON dump shows no `order` key anywhere (the ephemeral tier never writes to `values`).
   - Editorial + mechanical: `grep -n -i "reload\|remount" docs/examples/choices.md` — the amber caveat callout's text must state plainly that this order does not survive a reload/remount and falls back to grouped; cross-check the callout's presence and color-mode rendering visually against `#ordering-interleaved`'s amber callout and the ephemeral half of `#reload-behavior`.

5. **Add-order mode with `preserveOrder` on persists and compacts.**
   - Manual/scripted: with "Order added" + `preserveOrder` on, add the same three occurrences (CRM, API, CRM); confirm each occurrence's own values object in the JSON dump shows an `order` key (`1`, `2`, `3` respectively, matching click order). Cross-check visually against `#ordering-preserve` and `#ordering-values` (order key highlighted when present).
   - Manual/scripted: remove the second-added occurrence (the API endpoint, `order: 2`); confirm the JSON dump now shows the two survivors' `order` values compacted to `1, 2` (contiguous, no gap), visibly changing in the dump, matching `#ordering-removal`.
   - Mechanical: `grep -n "order" docs/examples/choices.md` (broad, illustrative) as a heuristic that the `order` key is actually named in prose near this subsection, with the editorial read as the real check (see AC6 below for the prose-content mapping).

6. **`docs/examples/choices.md` documents both tiers and the reload trade-off.**
   - Mechanical: `grep -n "displayOrder\|insertionOrder\|preserveOrder" docs/examples/choices.md` — all three identifiers must appear at least once, verbatim, exact casing, matching the finalized names from ST-02/ST-03's architecture references (catches a stale provisional name or a typo surviving into the published page, mirroring FEAT-001 ST-04's identical technique).
   - Editorial: confirm the new prose covers, in plain language: (a) the `displayOrder` flag and its two values (`'grouped'`/`'added'`); (b) the `insertionOrder` slot prop, named as ephemeral and never present in `values`; (c) the `preserveOrder` flag and the resulting `order` field in submitted values; (d) the reload trade-off stated side by side (ephemeral falls back to grouped; persisted reconstructs exactly), mirroring design decision 6's `#reload-behavior` framing; (e) the ADR-3 constraints, object-branch-only and the reserved-`order`-child-name collision, stated as the consumer's responsibility to avoid or not opt in.
   - Mechanical: `grep -n -i "object.*branch\|scalar" docs/examples/choices.md` (heuristic) plus editorial confirmation that the object-branch-only constraint and the reserved-key collision are both named explicitly, not only implied by the example's own metadata shape (which is already object-shaped, so a reader could otherwise miss that this is a real constraint rather than a coincidence of this particular demo).
   - Mechanical: `pnpm docs:build` must complete with no error (VitePress's dead-link checker is on by default in this project, confirmed no `ignoreDeadLinks` override in `docs/.vitepress/config.ts`, so a broken anchor/relative link in the new prose fails the build).

7. **`docs/reference/field-metadata.md` documents the two new flags.**
   - Mechanical: `grep -n "displayOrder\|preserveOrder" docs/reference/field-metadata.md` — both must appear as `### ` headings.
   - Editorial: each entry states type (`'grouped' | 'added'` for `displayOrder`, `boolean` for `preserveOrder`), default (`'grouped'`/absent, `false`/absent respectively), and a one-line pointer link to the choices example's ordering subsection, format-matched against the immediately adjacent `### explicitChoiceSelection` entry (type/default line, one-sentence description, short code example, pointer link) — the same precedent FEAT-001 ST-04 verified line for line against `### choice`/`### autoAddMinOccurs`.
   - Mechanical: `pnpm docs:build` — the pointer links are relative anchors into `choices.md`'s new subsection; the dead-link checker fails the build if the anchor slug does not match the actual generated heading id.

### Edge cases

- **Optional `seq-chip` teaching aid.** If included: editorial check that the surrounding prose explicitly marks it as a teaching aid, not shipped library UI (`grep -n -i "teaching aid" docs/examples/choices.md` as a heuristic, editorial read as the real check). If not included: no check applies; note in the manual verification checklist which choice was made.
- **`preserveOrder` toggled on, off, then back on: fresh counter, not resumed.** Manual/scripted (part of the interaction script below): add occurrences with `preserveOrder` on (JSON shows `order`), toggle off (JSON loses `order` entirely — confirmed visually), toggle back on (a fresh remount triggers AR-2's mount-time backfill, assigning `order` from current grouped position, not resuming the earlier sequence's counter). Editorial: confirm `docs/examples/choices.md` states this restart-not-resume behavior honestly, per the story's own edge-case wording, rather than implying continuity across flips.
- **Shared occurrence budget / per-branch `maxOccursTotal` continue to disable the relevant Add button.** Manual/visual: with the toolbar in any state (grouped or interleaved, `preserveOrder` on or off), fill a branch to its `maxOccursTotal` (3, per the existing metadata) or the choice to its shared `maxOccurs` (5) and confirm the Add button(s) disable exactly as in ST-04's/FEAT-001's baseline, matching `#states-limits`. This is a regression check (behavior pre-dates this story), not a new claim; confirm no toolbar state introduces a new way to bypass the budget.

### States policy (this slice)

Per the feature's states policy, the states this slice's own new surface (the toolbar) must be confirmed in, each cross-checked against its prototype anchor in both light and dark VitePress color modes:

- **Default** (toolbar at Grouped + `preserveOrder` off): AC3, byte-identical to ST-04's baseline.
- **Toolbar focus** (`#ordering-toolbar`): the segmented control's 2px sky focus ring and the `ToggleSwitch`'s existing sky focus-visible outline (already implemented in `ToggleSwitch.vue`, confirmed directly: `peer-focus-visible:outline peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-500`), both visually confirmed, not newly implemented for the toggle half.
- **Toolbar "on"/active** (`#ordering-toolbar`): the segmented control's selected-segment styling and the toggle's checked state, visually confirmed in both color modes.
- **Ordering: grouped** (`#ordering-grouped`): AC3.
- **Ordering: interleaved-ephemeral** (`#ordering-interleaved`): AC4, including its amber reload-caveat callout state, both color modes.
- **Ordering: interleaved-persisted** (`#ordering-preserve`): AC5.
- **Values/reload** (`#ordering-values`, `#reload-behavior`): AC5, AC6, the `order`-key-appears/disappears JSON states.
- **Removal, persisted tier** (`#ordering-removal`): AC5's compaction check.
- **Empty** (`#numbering-empty`, inherited from ST-04): confirm the toolbar itself still renders correctly with zero active occurrences (nothing to reorder yet); no ordering-specific empty state beyond ST-04's existing one.
- **Error** (`#states-error`, `xsd_choiceMinOccurs`, inherited unchanged): not retested here, confirmed as unaffected by any toolbar state per the feature's states policy; guarded by ST-02/ST-03's own validation-parity tests remaining green plus a spot-visual-check that the error message still anchors to the section header regardless of toolbar state.
- **Disabled/limits** (`#states-limits`): edge case above.

### Reactivity / `*.analytics.test.ts`

Not applicable. This story touches no `DynamicFormItem`, `computedProps`, or validation-wiring source file; it is a docs-only consumer of ST-02's and ST-03's already-shipped and already-tested engine primitives. No `.analytics.test.ts` file is added or extended. The manual interaction script below is the end-to-end sanity check that the demo wires those primitives correctly; it is not a substitute for ST-02/ST-03's own render-count-discipline test suites, which remain the load-bearing guard against a reactivity regression in the engine itself.

### Coverage

Not applicable. `pnpm -r ci:test:coverage` measures `packages/core` (and `packages/element-plus`); this story changes zero files under either package, so coverage is mathematically unaffected, mirroring FEAT-001 ST-04's identical note. Running `pnpm ci` once before push is still correct practice (cheap, confirms nothing else in the working tree regressed).

### Time sensitivity

Not applicable. No date/time-dependent content or logic is introduced by this story.

### Regression risk

- **`ChoiceArraySectionCard.vue` is a shared, generic slot-dispatch component**, not example-specific: confirmed directly, `AdvancedFormTemplate.vue`'s `heading-choice-array` slot (the fallback every repeatable explicit choice in the docs site renders through) instantiates it unconditionally. If the toolbar is added unconditionally inside `ChoiceArraySectionCard.vue` itself (rather than gated behind a prop, or hosted only in `FormExampleChoiceExplicitRepeatable.vue`), every current and future repeatable explicit choice example in the docs would grow this toolbar, not just this one demo. The architecture reference's "and/or ... per the implementer's preference" leaves this open; flagged here as the highest-risk implementation choice in this story, and the AC1 check mapping's editorial step above exists specifically to catch it. Currently only this one example uses `ChoiceArraySectionCard`, so today the blast radius is latent, not yet visible; a regression here would surface the next time a second repeatable explicit choice example is added to the docs.
- **ST-04's continuous-numbering baseline** (`RepeaterCard`'s `displayNumber`, `globalIndex + 1` badge) must remain visually correct across every toolbar state this story adds, not just the default one: AC3's check re-runs ST-04's own manual verification as a regression, and the interaction script below confirms the badge stays continuous (1..N of what is displayed) in interleaved mode too, per feature design decision 2.
- **`docs/examples/choices.md`'s existing "Add several" prose** (ST-04's baseline, the grouped-order guarantee paragraph) must stay accurate; this story's new prose extends it rather than contradicts it. Guarded by an editorial diff read (confirm the diff to the existing "Add several" subsection is additive-only) plus `pnpm docs:build` (catches a broken `<<<` include if one is accidentally touched).
- **`docs/reference/field-metadata.md`'s existing entries**, in particular `### explicitChoiceSelection` and `### attributes` immediately around the two new insertion points, must stay unmodified. Same additive-diff check.
- **Cross-story naming coupling (ST-02, ST-03, ST-04).** This story's grep checks and prose hardcode the finalized names `displayOrder`, `preserveOrder`, `insertionOrder`, `globalIndex`. If any of ST-02/ST-03's own adversarial review changes a name before this story implements (none is currently proposed), every grep check and prose reference in this plan needs updating in lockstep; flagged so a silent name drift is not missed.
- **No existing automated test guards any of this story's claims.** Consistent with FEAT-001 ST-04's own documented gap: this is a pre-existing, deliberate boundary of the project's tooling (no docs component-test harness, no fenced-snippet type-check harness), not something this story is scoped to fix.

### Manual verification checklist

An interaction script, since AC2/AC4/AC5's load-bearing claims (remount-on-flip, interleave-without-persistence, compaction-with-persistence) are runtime behaviors demonstrable only in a live session. Run once against a local `pnpm docs:dev` server before merge (Chromium via Playwright, `args: ['--no-proxy-server']` for localhost, per `CLAUDE.md`), in both light and dark VitePress color modes for every screenshot step:

1. `pnpm docs:build` completes clean (build-level gate for AC6's/AC7's anchors and any malformed fence, required by `CLAUDE.md`'s "Before Every Push" step 5 for any `docs/` change).
2. Open the "Add several, each one of several kinds" example fresh (toolbar at default: Grouped, `preserveOrder` off). Screenshot the toolbar's default state, compare against `#ordering-toolbar`.
3. Click "Add CRM export", "Add API endpoint", "Add CRM export" (in that order). Confirm the cards render `crmExport, crmExport, apiEndpoint` (grouped, `crmExport`-first) with continuous badges 1, 2, 3 (AC3, regression against ST-04). Screenshot, compare against `#ordering-grouped`. Confirm the JSON dump has no `order` key anywhere.
4. Flip the segmented control to "Order added" (`preserveOrder` still off). Confirm: (a) the choice remounts (AC2); (b) the three previously entered occurrences' own field data is still present (e.g. any typed CRM system/URL values survive); (c) the display falls back to grouped order (`crmExport, crmExport, apiEndpoint`), *not* the original click order, since the flip wiped the ephemeral `insertionOrder` history built up in step 3 (this is the ephemeral-tier reload-fallback behavior, made concrete by a mid-session flip rather than an actual page reload). Screenshot.
5. With the toolbar still on "Order added", click "Add API endpoint" once more (a genuinely new add-press this session). Confirm the four cards now render `crmExport, crmExport, apiEndpoint, apiEndpoint` — the three pre-flip occurrences still in their grouped position (no `insertionOrder`, so they sort first per the deterministic two-key comparator) and the new occurrence appended last (the one occurrence with an `insertionOrder` this session). Confirm the JSON dump still has no `order` key anywhere. Screenshot, compare against `#ordering-interleaved`; confirm the amber reload-caveat callout is visible and legible in both color modes (AC4).
6. Flip `preserveOrder` on (segmented control still "Order added"). Confirm: (a) the choice remounts again (AC2); (b) all four occurrences' field data still present; (c) the JSON dump now shows an `order` key on every occurrence, backfilled from the current grouped position (`1, 2, 3, 4` in grouped order, per AR-2's mount-time backfill, since none of the four had `order` before this flip) — not resuming any earlier click-order numbering. Screenshot, compare against `#ordering-preserve` and `#ordering-values`.
7. Click "Add CRM export" once more. Confirm its `order` is `5` (count + 1) and it renders at the end of the displayed (interleaved) sequence.
8. Remove the occurrence holding `order: 2`. Confirm the JSON dump shows the four survivors' `order` values compacted to `1, 2, 3, 4` (contiguous, no gap), visibly changed in the dump. Screenshot, compare against `#ordering-removal`.
9. Toggle `preserveOrder` off. Confirm the JSON dump loses the `order` key from every occurrence entirely (the persisted tier's data is gone once opted out, per AC6's documented trade-off), while field data (CRM system, URL, etc.) survives the remount.
10. Toggle `preserveOrder` back on. Confirm a fresh backfill runs and the new `order` sequence starts from `1` again at the current grouped position, *not* resuming the sequence from step 8 (the edge case above). Screenshot.
11. Exhaust one branch's `maxOccursTotal` (3) or the choice's shared `maxOccurs` (5) in any toolbar state; confirm the relevant Add button(s) disable, matching `#states-limits` (edge case, regression check).
12. Click through the two new `docs/reference/field-metadata.md` pointer links (`displayOrder`, `preserveOrder`) and confirm each lands on the correct anchor inside the new `choices.md` subsection (not just that the link resolves, per FEAT-001 ST-04's precedent for this exact check).
13. `grep -rn '—' docs/examples/choices.md docs/reference/field-metadata.md` (em dash, U+2014), scoped to this story's own diff — must return no matches in the new content, per `CLAUDE.md`'s "never use em dashes" rule.
14. `grep -n -- ':display-order=\|:preserve-order=\|:add-choice-occurrence=\|:remove-choice-occurrence=\|:can-add-choice-occurrence='` across the changed `.vue` files and any new fenced Vue snippets in `choices.md` — must return no matches; a kebab-case binding would silently violate `CLAUDE.md`'s "Vue: always use camelCase, never kebab-case" rule, since markdown code fences are not linted.
15. If `docs/examples/choices.md` gains any new fenced `ts`/`vue` snippet showing `displayOrder`/`preserveOrder` metadata usage (likely, per AC6's "shape" requirement), paste its type usage into a scratch file under `packages/core/src/` alongside the shipped ST-02/ST-03 `FieldMetadata` types and run `npx vue-tsc --noEmit` once before merge, mirroring FEAT-001 ST-04's identical one-time check for its own AC2. Delete the scratch file after, confirm via `git status`.
16. After opening the PR: verify the Cloudflare Pages preview build renders both changed pages correctly, per `CLAUDE.md`'s "Before Every Push" step 5.

### Untestable-as-written / rewrite proposals

No acceptance criterion is untestable as written. AC2's remount claim and AC4/AC5's runtime ordering/persistence claims are testable, but only through a live interaction, never through `grep` or `pnpm docs:build` alone; the Manual verification checklist above exists specifically to make that testable rather than assumed, following the exact precedent FEAT-001 ST-04 set for its own comparably unverifiable-by-tooling AC2 ("runnable").

### Flags for reviewer

- **AC2 assumes, without stating it explicitly, that entered occurrence field data survives a toolbar flip while only the ordering-related ephemeral/persisted state resets/recomputes per the flag semantics.** The edge case bullet about `preserveOrder` toggled off-then-on ("the JSON's order values restart from a fresh counter... rather than resuming the earlier sequence") only makes sense if the occurrences themselves (and their non-`order` field values) persist across the remount; otherwise there would be nothing left to talk about "losing order" specifically, as distinct from losing everything. The story's own architecture text says the demo "re-keys the relevant metadata/form," which is ambiguous between remounting only the choice's own component instance (preserves form-level `values` automatically, since those live in the parent form context) versus remounting the whole form (which would need the current `values` explicitly re-seeded as `initialValues` to preserve entered data, or every flip would silently wipe the entire demo, including the badge/CRM-system/URL fields, not just the ordering state). This plan's interaction script (steps 4, 6, 9, 10) tests the reading that field data persists and only ordering state resets, since that is the only reading consistent with the story's own edge case; flagging so the implementer/reviewer confirms this reading rather than it being assumed silently by the QA plan.
- **Whether `ChoiceArraySectionCard.vue` or `FormExampleChoiceExplicitRepeatable.vue` hosts the toolbar is left open by the architecture reference**, and this plan's Regression risk section names the shared-component host as the higher-risk choice (it would leak the toolbar into every repeatable explicit choice example in the docs site, not just this one). Not a blocker, since the architecture reference explicitly defers this to the implementer, but flagged so the implementer weighs it deliberately rather than defaulting to the shared component for convenience.
- **The optional `seq-chip` teaching aid's inclusion is genuinely optional per the story's own edge case**, so this plan's check for it is conditional (see Edge cases above); flagging so its absence in the shipped docs is not mistaken for a missed AC.

## Adversarial review

Filled by adversarial-reviewer (2026-09-19), STORY mode (lite). Model: claude-opus-4-8.

Verified directly against the docs theme: `ChoiceArraySectionCard.vue` is instantiated unconditionally by `AdvancedFormTemplate.vue`'s `heading-choice-array` slot (lines 192-205); `FormExampleChoiceExplicitRepeatable.vue` already renders the `<pre>{{ JSON.stringify(values, ...) }}</pre>` dump (line 57-65) and declares object branches (`crmExport: {crmSystem, exportSchedule}[]`, `apiEndpoint: {url, apiKey}[]`), so the persisted-tier `order` demo is viable on it; the metadata caps are real (`maxOccurs: 5` shared, `maxOccursTotal: 3` per branch), so the QA plan's limit references are accurate; `crmExport` is declared before `apiEndpoint`, confirming the `crmExport`-first grouped baseline; and `ToggleSwitch.vue` carries the `peer-focus-visible:outline ... outline-sky-500` focus ring the plan cites. The finalized flag names (`displayOrder`, `preserveOrder`, `insertionOrder`, `globalIndex`, `order`) all match the approved feature. Dependencies on ST-02/ST-03/ST-04 are explicit in both the story's Dependencies list and its architecture reference. No blockers.

### Findings

1. **(should-fix) AC2's re-key scope is ambiguous and its data-survival claim is unspecified.** AC2 says the example "re-keys the relevant metadata/form", but the approved feature decided re-key the FORM (ADR-6; design decision 3's Q8 note). A naive `:key` bump on the form re-initialises `useForm` from `initialValues` and wipes all entered occurrence field data, which directly breaks the QA interaction script (steps 4b/6b/9) and the `preserveOrder` off-then-on edge case, both of which assume field data survives while only ordering state resets. Conversely, re-seeding current values verbatim leaves the `order` key present after `preserveOrder` is switched off, breaking step 9's "the JSON dump loses the `order` key entirely" (the engine with `preserveOrder` off never strips a pre-existing `order`). Not a contradiction with the feature (the feature's framing only ever says the ephemeral click history is wiped, implying field data survives), but a real under-specification of a load-bearing runtime claim. Routed as PROPOSED into AC2 and the architecture reference: re-key the form, snapshot current values and re-seed as `initialValues`, and strip `order` from the seed when `preserveOrder` is turned off.

2. **(should-fix) Hosting the toolbar unconditionally in `ChoiceArraySectionCard.vue` leaks demo chrome into every repeatable explicit choice example.** Confirmed directly: `ChoiceArraySectionCard.vue` is the shared fallback that `AdvancedFormTemplate.vue`'s `heading-choice-array` slot instantiates unconditionally (lines 192-205), not an example-specific component. AC1's "hosted in `ChoiceArraySectionCard.vue` and/or the example component" permits the leak. Today only this one example uses the card so the blast radius is latent, but the next repeatable explicit choice example added to the docs would grow this toolbar unbidden. Routed as PROPOSED into AC1 and the architecture reference: host the toolbar in `FormExampleChoiceExplicitRepeatable.vue`, or gate it behind an explicit opt-in prop the card renders only on request, never a default-on render inside the shared card.

3. **(nit) The runnable interaction script never exercises AC4's clean interleaved sequence.** AC4's core claim (three fresh adds in "Order added" mode render `crmExport, apiEndpoint, crmExport` in click order) is only demonstrable from an empty/fresh start in `displayOrder: 'added'`, because flipping to "Order added" mid-session wipes the ephemeral history and falls back to grouped (AC2/step 4). The numbered checklist starts adding in grouped mode (step 3), so it only ever shows the grouped-fallback and appended-item cases (step 5), not the clean interleave. AC4's check mapping describes the fresh-session check abstractly, so this is coverage completeness, not a hole: add a numbered step that starts from zero occurrences in "Order added" and adds CRM/API/CRM to observe the interleaved order directly.

4. **(nit) The `seq-chip` teaching aid is handled correctly.** Ruling on the qa-planner's third flag: the conditional check in the QA plan (editorial "teaching aid" confirmation if included, no check if omitted) is the right treatment and is consistent with feature design decision 4, which makes the chip genuinely optional. No change needed; recorded so its optionality is not later mistaken for an unmapped AC.

### Status rationale

No blockers, no unresolved Open questions (the story has no Open questions section). Both should-fixes are routed as `PROPOSED (adversarial review)` edits into the sections that own them (AC1, AC2, architecture reference), so neither independently forces discussion. Status set to `awaiting-approval`.
