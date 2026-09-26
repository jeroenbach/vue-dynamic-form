---
id: QUICK-003
type: quick
status: done
approved_by: Jeroen
pr: ""
---

# Quick: attribute clear-on-unmount only when the owner's value is gone, plus Storybook manual test cases

## Problem

QUICK-002 (done, uncommitted on the working tree) made `keepValuesOnUnmount` work, but kept attribute fields **always** clearing on unmount (the `partOfAttributeField` branch in `DynamicFormItem.vue`'s `onBeforeUnmount`). Jeroen identified the remaining bug: attribute unmount has two causes with opposite correct behaviors.

1. **Owner value emptied.** `showAttributes` (`DynamicFormItem.vue:290-292`, `attributes?.length && checkTreeHasValue(value.value)`) goes false, the attribute items unmount, and purging their values is the feature: an empty complex value must not keep stale attributes.
2. **UI-driven unmount.** A template hides a subtree with `v-if`, or the whole form unmounts (e.g. after submit). The owner still has its main value, so wiping its attributes while the main value survives is inconsistent. Under `keepValuesOnUnmount: true` the result is a preserved value with amnesia about its attributes.

Today's code cannot tell the two apart: the attribute item clears unconditionally.

There is also no manual-test surface for any of the QUICK-002/QUICK-003 unmount behavior; Jeroen explicitly asked for Storybook test cases to walk it by hand.

## Proposed change

**Engine (decided with Jeroen in conversation):** the attribute item distinguishes the cause at unmount time by asking whether its owner still has a main value.

- The parent already has that answer as a lazy computed (`fieldContext.hasValue`, `DynamicFormItem.vue:140`) and is the component that renders the attribute items (`#attributes` slot, `DynamicFormItem.vue:539-556` region), so it passes a getter down alongside the existing marker: new optional `attributeOwnerHasValue?: () => boolean` on `DynamicFormItemProps`, bound as `:attribute-owner-has-value="() => fieldContext.hasValue.value"` (exact wiring is the implementer's, the contract is "callable at unmount time, answers whether the owner currently has a main value").
  - PROPOSED (adversarial review): pin the getter to a direct, non-lazy read of the owner's live value, `:attribute-owner-has-value="() => checkTreeHasValue(value.value)"`, rather than routing through the `fieldContext.hasValue` computed. On whole-form unmount Vue runs the owner's `beforeUnmount` and then `scope.stop()` before the attribute child's `beforeUnmount`, so by the time the child calls the getter the owner's `hasValue` computed belongs to an already-stopped effect scope. A stopped computed's dirty-tracking is version-specific; `checkTreeHasValue(value.value)` closes over the same live vee-validate ref, returns the correct answer with no reliance on the computed's stopped-scope behaviour, and states the contract unambiguously for the implementer. (See finding 2.)
- In `onBeforeUnmount`, for `partOfAttributeField` items: owner has **no** main value → purge regardless of keep flags (cause 1, today's guarantee, unchanged). Owner **still has** a value → the attribute follows the same effective-keep-flag semantics as every other field (`fieldOptions.keepValueOnUnmount ??` form-level `keepValuesOnUnmount`), fixing cause 2.
- Vue's unmount ordering keeps whole-form unmount consistent: a parent's `beforeUnmount` runs before its children's, so under default settings the owner clears its main value first and the attribute sees owner-empty and purges (same net result as today); under a keep flag the owner keeps its value and its attributes correctly survive with it.
- Alternative considered and rejected: a parent-side watcher that clears attribute paths whenever the owner's value empties (and drops the unmount-clear entirely). It works, but adds a watcher to every complex field and a second write path into form values; the owner-has-value check is a one-condition change to the exact hook QUICK-002 just touched, with the six existing unmount tests already pinning everything around it.

**Storybook manual test cases:** new test-case component(s) in `packages/core/src/examples/` exported through `examples/index.ts` (the existing `createTestCase` factory in `__tests__/TestFormTemplate.testcases.ts` builds metadata-only cases; the v-if scenario needs a small bespoke example component, since a fixed test-case template cannot conditionally unmount a subtree), demonstrating:

- a complex field with attributes plus sibling plain fields;
- a toggle that `v-if`-unmounts the subtree containing them while a live form-values JSON panel stays mounted;
- a `keepValuesOnUnmount` toggle (`TestForm.vue` already gained that prop in QUICK-002; the story helper's `extraProps` can forward it, or the bespoke component takes it as a prop);
- so both scenarios are manually walkable: hide/show with the flag on (values and attributes survive), hide/show with the flag off (values gone), clear the main value while mounted (attributes purge even with the flag on).

Plus a new story file `playgrounds/storybook/stories/testCases/KeepValuesOnUnmount.stories.ts` following the existing `testCases/Attributes.stories.ts` pattern (import from `@bach.software/vue-dynamic-form/examples`, doc comments on each story describing what to click and what to expect).

**Relation to other specs:** refines QUICK-002 (does not revert it; builds on the uncommitted working tree). Does not touch FEAT-003; the wizard `v-show` contract stands regardless, since a `v-if` page still deregisters its fields' validation even when values are preserved.

**`packages/core/src/` is touched**, so a changeset is required: **minor**, by QUICK-002's own `DECIDED (research)` precedent (a new optional member on the publicly exported `DynamicFormItemProps` grows the published type surface).

## Affected files

- `packages/core/src/components/DynamicFormItem.vue` — `onBeforeUnmount` owner-check condition; `#attributes` slot binds the new getter on attribute child items.
- `packages/core/src/types/DynamicFormItemProps.ts` — new optional `attributeOwnerHasValue?: () => boolean` (additive, doc comment matching `partOfAttributeField`'s style).
- `packages/core/src/components/__tests__/DynamicFormItem.unmount.logic.test.ts` — new scenarios (see Test impact); the existing six stay green untouched.
- `packages/core/src/examples/` — new bespoke test-case component (+ export via `examples/index.ts`); possibly a `createTestCase`-based case for the non-v-if parts.
- `playgrounds/storybook/stories/testCases/KeepValuesOnUnmount.stories.ts` — new.
- `specs/components.md` — the new prop; note the refined attribute unmount semantics on the `DynamicFormItem` row.
- `docs/reference/dynamic-form.md` — QUICK-002 added an "attribute fields always clear" caveat; soften it to the refined rule (attributes clear when the owner's value is gone; they follow the keep flags when the owner still has a value).
- `.changeset/*.md` — minor.

## Test impact

New tests in `DynamicFormItem.unmount.logic.test.ts`:

- `keepValuesOnUnmount: true` + `v-if`-unmounted subtree containing a complex field with attributes → **both** the main value and the attribute values survive in `form.values` (red today, green after: this is the bug).
- Default settings + the same `v-if` hide → attribute values gone (pins that today's default behavior is unchanged).
- Owner main value emptied while mounted → attributes purge even under `keepValuesOnUnmount: true` (already exists as QUICK-002's third promise test; must stay green, now guaranteed by the owner-check rather than unconditional clearing).
- Whole-form unmount under `keepValuesOnUnmount: true` → main value and attributes both survive (exercises the unmount-ordering reasoning).

All six existing QUICK-002 tests stay green untouched. Full `pnpm run ci` (never bare `pnpm ci`), coverage must not drop (`pnpm -r ci:test:coverage`). Storybook stories are manual-verification surface, not asserted by CI beyond compiling.

## Adversarial review

Reviewed against the current working tree (QUICK-002 changes already applied to `DynamicFormItem.vue`, `DynamicFormItemProps.ts`, and the six unmount tests). No blockers found; the core design is sound. Findings below are one should-fix (routed as a PROPOSED edit) and nits.

1. **The two-cause analysis is correct and self-consistent. (verified, no action)** `showAttributes` (`DynamicFormItem.vue:298-300`) is `attributes?.length && checkTreeHasValue(value.value)`, and for a complex type `value` is the vee-validate ref at `path['value']` (the main value only, not the whole `{ value, ...attributes }` object). So an attribute item is mounted only while the owner has a main value, and the getter's predicate `checkTreeHasValue(value.value)` (via `fieldContext.hasValue`, `line 148`) is the *identical* predicate. "Owner empty at unmount" therefore reliably identifies cause 1, and cause 2 (owner still has value) is exactly its complement. This symmetry is the elegant heart of the fix.

2. **should-fix: the getter reads the owner's `hasValue` computed after the owner's effect scope has already been stopped, which is version-specific behaviour.** Vue's `unmountComponent` runs the owner's `beforeUnmount`, then `scope.stop()`, then recurses into the subtree where the attribute child's `beforeUnmount` runs. So on whole-form/subtree unmount the attribute child calls `attributeOwnerHasValue()` while the owner's `hasValue` computed lives in a stopped scope. I traced the outcomes and this is *benign in every tested and realistic scenario*: under default settings the owner's value was already cleared before `scope.stop()` (computed marked dirty, recomputes to `false`), and even if a stale `true` leaked, the attribute's effective keep flag is `false` so it purges anyway; under a keep flag the owner returns early without clearing, so the cached `true` is correct. The only path where a stale getter could flip the result is the exotic combination "owner `fieldOptions.keepValueOnUnmount: false` explicitly + attribute or form keep true, during unmount", which no one is likely to construct. Still, relying on a stopped computed's dirty-tracking is an avoidable hazard and the spec leaves the wiring loose. Resolution: PROPOSED edit in the Proposed change section pins the getter to a direct `checkTreeHasValue(value.value)` read over the same live ref. Routed, so it does not force discussion.

3. **Vue unmount-ordering claim verified. (no action)** Parent `beforeUnmount` runs before children's `beforeUnmount` (`unmountComponent`: `bum` -> `scope.stop()` -> `unmount(subTree)` -> children). The spec's bullet 3 is correct: under default settings the owner clears its main value first, the attribute then sees owner-empty and purges (same net result as today); under a keep flag the owner returns early and its attributes correctly survive with it.

4. **The discriminating test genuinely goes red today; all four scenarios are constructible with the existing helpers. (verified, no action)** Test 1 (`keepValuesOnUnmount: true` + unmount a complex field with attributes) fails against the current tree because the `partOfAttributeField` branch clears the attribute unconditionally while the owner keeps its main value, so `text.lang` is gone today and survives after the fix. The existing tests already unmount subtrees via `wrapper.setProps({ metadata })` (e.g. `DynamicFormItem.unmount.logic.test.ts:112-117`), which unmounts the owner and its attributes together and is equivalent to a `v-if` hide; no bespoke component is needed for the unit tests (the bespoke component is only for the Storybook manual surface). Test 3 already exists (line 146) and stays green now via the owner-empty path rather than unconditional clearing.

5. **nit: the spec says test 4 (whole-form unmount under `keepValuesOnUnmount: true`) "exercises the unmount-ordering reasoning", but it does not.** Under a keep flag the owner returns early and never clears, so no ordering is exercised; the value simply survives via vee-validate's own keep handling. The ordering path (owner clears in `beforeUnmount`, child then reads empty) is actually covered by test 2 (default settings + hide). Consider rewording test 4's rationale to "pins that a keep flag preserves both the owner value and its attributes across a full unmount" and, if the ordering path is to be pinned deliberately, note that test 2 is the one that traverses it. Not blocking; the tests themselves are correct, only the stated rationale is off.

6. **nit: the getter binding `() => fieldContext.hasValue.value` is a fresh closure on every owner render, so the attribute children receive a new `attributeOwnerHasValue` prop identity each render.** The attribute items already re-render with their owner (they sit in the owner's template subtree), so this adds no new render, but it is worth a glance against the `analytics` render-count assertions when the tests are written. A direct `checkTreeHasValue(value.value)` getter (finding 2) has the same identity churn, so this is purely a "confirm the analytics counts still hold" note.

7. **nit: give the docs caveat its replacement wording.** `docs/reference/dynamic-form.md:67` currently reads "Attribute fields ... always clear on unmount regardless of either flag, since they are conditionally mounted on their parent having a value." Suggested softened wording: "Attribute fields (a field's `attributes` entries) clear on unmount when the owning field's own value is gone (an empty complex value keeps no stale attributes); when the owning field still has a value, its attributes follow the same `keepValuesOnUnmount` / `fieldOptions.keepValueOnUnmount` rules as any other field."

8. **Changeset (minor) and consistency with the six existing tests verified. (no action)** `DynamicFormItemProps` is publicly re-exported (`packages/core/src/index.ts:14`); adding an optional member is additive, so minor is correct per QUICK-002's precedent. Every guarantee the six existing tests pin is preserved: the three "pinned guarantees" are unaffected, the two keep-flag tests are unaffected, and "still clears an attribute even when the form-level flag is true" (line 146) now holds via the owner-empty path (owner is still mounted, its live `hasValue` is `false`, so the attribute purges) rather than via unconditional clearing.

## Implementation notes

- Engine: added `attributeOwnerHasValue?: () => boolean` to `DynamicFormItemProps`, bound in `DynamicFormItem.vue`'s `#attributes` slot as `:attribute-owner-has-value="() => checkTreeHasValue(value)"` (not `value.value`, see deviation below). `onBeforeUnmount` now computes `ownerValueIsGone = props.partOfAttributeField && !props.attributeOwnerHasValue?.()`: when true the attribute clears unconditionally (unchanged guarantee); otherwise it applies the same effective-keep-flag check as any other field. Falls back to purging when `attributeOwnerHasValue` is not provided at all, preserving the old always-clear behavior as a safe default for any caller that does not wire the getter.
- Deviation: the spec's literal wiring `() => checkTreeHasValue(value.value)` throws at unmount time. `value` is a top-level `<script setup>` ref, and Vue's template compiler auto-unwraps top-level refs everywhere in the template render context, including inside inline expressions like this getter; by the time the closure runs, `value` already resolves to the unwrapped current value, so a further `.value` access fails once the value is `undefined` (confirmed by running the new tests red against the literal wording: three pinned/keep tests threw an unhandled `beforeUnmount` error). Using `checkTreeHasValue(value)` is the direct equivalent read the review asked for, expressed correctly for the template context; verified by rerunning all nine unmount tests, which passed once corrected.
- Deviation: `packages/core/src/examples/TestForm.vue` previously destructured `keepValuesOnUnmount` from `defineProps()` and passed the plain captured boolean into `useDynamicForm()`, so a prop change after mount never reached vee-validate. This made the new Storybook toggle a no-op (verified via screenshot: toggling the flag after fill-in did not change the unmount outcome). Fixed by passing `computed(() => keepValuesOnUnmount)` instead, which is a `Ref<boolean>` and satisfies the existing `MaybeRef<boolean>` contract of `useDynamicForm`'s `keepValuesOnUnmount` option without needing to widen that public type. This only affects the internal test/example harness, not the published surface.
- Storybook: added `packages/core/src/examples/KeepValuesOnUnmountTestCase.vue` (exported via `examples/index.ts`) and `playgrounds/storybook/stories/testCases/KeepValuesOnUnmount.stories.ts` with three stories walking hide/show with the flag on, hide/show with the flag off, and clearing the owner value while mounted. Verified by running `pnpm --filter @bach.software/vue-dynamic-form build` then `pnpm run build-storybook` in `playgrounds/storybook` (succeeds, story bundled), and by driving the three manual scenarios end to end with Playwright against a local Storybook dev server, confirming the debug JSON panel matches each story's documented expectation. A bare `npx tsc --noEmit` in `playgrounds/storybook` fails on every story file (old and new alike) with a duplicate-`@vue/runtime-core`-package "compatConfig" mismatch between the root and the playground's own `node_modules`; this is a pre-existing environment artifact of running `tsc` outside Storybook's own Vite-based resolution, not something introduced here, and the successful `build-storybook` run is the authoritative compile check.
- Docs: softened the attribute-unmount caveat in `docs/reference/dynamic-form.md` to the refined rule (reviewer's suggested wording, verbatim). `pnpm docs:build` compiles.
- Test count: three new tests added (the spec's "already exists" bullet for the owner-emptied-while-mounted case matches the pre-existing QUICK-002 test, so it was left untouched); all nine tests in `DynamicFormItem.unmount.logic.test.ts` pass, alongside the full 553-test core suite and both analytics suites.
- Changeset: `.changeset/attribute-unmount-owner-check.md`, minor, added alongside the pre-existing uncommitted `.changeset/keep-values-on-unmount.md` from QUICK-002 (left as-is, not amended).
