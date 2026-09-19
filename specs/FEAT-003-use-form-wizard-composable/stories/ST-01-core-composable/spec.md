---
id: ST-01
type: story
feature: FEAT-003
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Core `useFormWizard` composable

## Functional
### User story
As a library consumer building a multi-step wizard on top of `DynamicForm`, I want a headless `useFormWizard` composable that owns step navigation, page-path derivation, and validation-gated advancing, so that I no longer hand-roll module-level path state, a `computedProps` side effect on every page, and a Promise-based transport just to move between wizard steps.

### Acceptance criteria

Working names used below (final export names, additive, all new): `useFormWizard`, `useFormWizardContext`, `FormWizardPage` (page descriptor), `FormWizardOptions` (options bag), `FormWizardContext` (the composable's return type, also what `useFormWizardContext()` returns).

**Page-path derivation (ADR-1: replicate `DynamicForm.vue:75-76`'s three-part logic, with `parent` always absent since this composable only ever receives a flat children array, never the ancestor chain above it):**

1. **Explicit `path` wins.**
   Given a page item in the array passed to `useFormWizard` that sets an explicit `path`,
   When `wizard.pages` is computed,
   Then that page's `path` in the result equals the explicit value verbatim, never a derived join.

2. **Falls back to `name` when no explicit `path` and no ancestor prefix applies (the demo's case: the wizard root sets `path: ''` and its children set no `path`).**
   Given a page item with a `name` and no `path`,
   When `wizard.pages` is computed,
   Then that page's `path` equals the item's `name`, matching what `[parent?.path, fieldName].filter(Boolean).join('.')` collapses to when there is no non-empty ancestor prefix (`parent` is `undefined` from this composable's point of view; `Boolean('')` is also `false`, so an explicit empty-string wizard root produces the identical result).

3. **Falls back to `field-${index}` when neither `path` nor `name` is set**, mirroring `DynamicForm.vue:75`'s own default, using the item's position in the input array as `index`.

4. **Nested-wizard support is explicit-`path`-only, and the reference docs must say so (ST-03).**
   Given a wizard whose real ancestor path in the actual metadata tree is non-empty (so `DynamicForm` would register a page at, say, `outer.wizard.company`), and given that `useFormWizard` only ever receives the wizard node's `children` array (Q1, decided), never the wizard node itself or its ancestors,
   When such a page needs a correct derived path,
   Then the consumer sets that page's `path` explicitly to the real registered path (`'outer.wizard.company'`), and `wizard.pages` uses it verbatim per AC1. There is no implicit ancestor-prefix join inside this composable; unlike `DynamicForm.vue`, it has no `parent` to join against.

5. **`pages` preserves input order (ordering invariant).**
   Given N page items in declaration order,
   When `wizard.pages` is read,
   Then it is a same-length array in the identical order, index-for-index, so a consumer's `currentStepIndex === index` comparisons (e.g. against the engine's own render `index`) stay valid.

**Navigation:**

6. **`next()` advances only when validation passes.**
   Given a stubbed `validateSection` that resolves `{ valid: true, ... }` for the current page's derived path,
   When `next()` is called and awaited,
   Then `currentStepIndex` increments by exactly one and `next()` resolves `true`.

7. **`next()` does not advance when validation fails.**
   Given a stubbed `validateSection` that resolves `{ valid: false, ... }`,
   When `next()` is called and awaited,
   Then `currentStepIndex` is unchanged and `next()` resolves `false`.

8. **`next()` validates the current page's own derived path, not a stale or hardcoded one.**
   Given `currentStepIndex` at index 2 of a 4-page wizard,
   When `next()` is called,
   Then the stubbed `validateSection` is called with exactly `wizard.pages.value[2].path`.

9. **`next()` at the last page is a no-op advance (defensive floor).**
   Given `currentStepIndex` already at the last index and validation resolves valid,
   When `next()` is called,
   Then `currentStepIndex` stays at the last index (mirrors today's `FormWizard.vue` guard: `if (currentStepIndex.value < steps.length - 1) currentStepIndex.value++`).

10. **`prev()` decrements, floored at 0.**
    Given `currentStepIndex > 0`, `prev()` decrements it by one.
    Given `currentStepIndex === 0`, `prev()` leaves it at 0.

11. **`isFirst`/`isLast` are computed from `pages.length` and `currentStepIndex`.**
    Given N pages, `isFirst` is `true` only when `currentStepIndex === 0`, `isLast` is `true` only when `currentStepIndex === N - 1`.

12. **`gotoStep(index)` is backward-only by default (Q2, decided).**
    Given `currentStepIndex` at 3, `gotoStep(1)` (backward) moves to index 1.
    Given `currentStepIndex` at 1, `gotoStep(3)` (forward) with no options set does **not** move, matching today's docs behavior exactly.

13. **`gotoStep` honors an opt-in `allowForwardJump`.**
    Given `useFormWizard(pages, { ...opts, allowForwardJump: true })`,
    When `gotoStep` is called with a forward index,
    Then it moves there. (If `validateOnJump` is also set, the jump additionally gates on `validateSection` for the current page first, same pattern as `next()`; settle the exact interaction during implementation, consistent with `next()`'s gating, since the feature spec names both options without pinning their combination.)
   > PROPOSED (adversarial review): the "settle during implementation" softening reads as developer discretion, but the QA plan (item 13) already pins the contract by test: a forward `gotoStep` with `validateOnJump: true` calls `validateSection(currentPage.path)` (the pre-jump page) and moves only when it resolves valid, index-for-index mirroring `next()`. Since `validateOnJump` is a published option (harder to change post-ship), treat that pinned reading as the contract rather than open discretion. This matches `next()` (ladder rung 3, codebase pattern) and does not need Jeroen. It leaves `isValidating`'s behaviour during a `validateOnJump` gate unspecified (see finding 2) and does not define multi-step forward-jump semantics (only the current page is validated; intermediate pages are the consumer's responsibility, same as `next()`'s per-page model).

14. **`gotoStep` ignores an out-of-range index** (negative, or `>= pages.length`), mirroring today's `Stepper`/`FormWizard.vue` guard (`_index >= 0 && _index <= steps.length - 1`).

**Submit (Q3, decided: option (a), composable owns it):**

15. **`submit()` calls the supplied `onSubmit`.**
    Given `useFormWizard(pages, { validateSection, onSubmit })` with a stubbed `onSubmit`,
    When `wizard.submit()` is called and awaited,
    Then `onSubmit` was called exactly once.

**`isValidating` (Q4, decided: included from the start):**

16. **`isValidating` toggles around `next()`'s in-flight validation.**
    Given a `validateSection` stub whose promise resolves only after being manually released,
    When `next()` is called,
    Then `isValidating` is `true` immediately (before the stub resolves) and becomes `false` once the promise settles.

17. **`isValidating` toggles around `submit()`'s in-flight `onSubmit`.**
    Given an `onSubmit` stub whose promise resolves only after being manually released,
    When `submit()` is called,
    Then `isValidating` is `true` while pending and `false` once settled.

**Provide/inject channel (ADR-2, ADR-3, ADR-4):**

18. **`useFormWizardContext()` reads the same reactive instance a `useFormWizard()` ancestor provided.**
    Given a parent component that calls `useFormWizard(...)`,
    When a descendant calls `useFormWizardContext()` and then calls `next()`/`prev()`/`gotoStep()` on the result,
    Then the parent's own `currentStepIndex` (and any other consumer of the same context) reflects the change: it is the same reactive object, not a copy.

19. **`useFormWizardContext()` throws a clear error outside a wizard-providing ancestor.**
    Given a component tree with no ancestor `useFormWizard()` call,
    When a component calls `useFormWizardContext()`,
    Then it throws an `Error` whose message identifies that no `useFormWizard()` ancestor was found (not a silent `undefined` return), per ADR-3.

**Public surface and process:**

20. **New exports are additive.**
    Given `packages/core/src/index.ts`,
    When this story ships,
    Then it additionally exports `useFormWizard`, `useFormWizardContext`, `FormWizardPage`, `FormWizardOptions`, and `FormWizardContext` (or whatever final names implementation settles on, kept consistent across code/docs/`specs/components.md`), and no existing export's signature or behavior changes.

21. **`specs/components.md` documents the new surface, including the one-wizard-per-provider-subtree constraint.**
    Given ADR-4's single-Symbol default,
    When this story ships,
    Then `specs/components.md` gains a "Composables & core" row for `useFormWizard`/`useFormWizardContext` and states the one-wizard-per-provider-subtree constraint (a second `useFormWizard()` call, or a nested `DynamicForm`-with-wizard inside a wizard page, silently injects the wrong outer wizard with no error), per finding 5's resolution.

22. **A changeset is added with a `minor` bump.**
    Given the additive-only export set,
    When this story ships,
    Then `pnpm changeset` produces a `minor`-bump entry, matching the feature architecture's Public API impact section.

### Edge cases
- Zero pages (`pages` resolves to an empty array): must not throw. `isFirst` is `true` (`currentStepIndex === 0`), `isLast` is `false` (`0 === -1` is false); this is a degenerate input, not a real use case, and only needs to not crash.
- Single-page wizard: `isFirst` and `isLast` are both `true` at index 0.
- `pages` is a `MaybeRefOrGetter` (ref, getter, or plain array); a reactive/computed source must still produce a live `wizard.pages` (per the feature architecture's Reactivity implications note, matching `useDynamicForm`'s `MaybeRefOrGetter` accessor convention).
- Double-clicking `next()`/`submit()` while a call is already in flight: `isValidating` is the signal a template should use to disable the button; the composable itself is not required to debounce or reject a concurrent call.
- A repeatable wizard page (`maxOccurs > 1`, e.g. `projectContacts[0..2]`): its derived page `path` has no `[` in it (it is the *static* declared path, e.g. `projectContacts`), and `validateSection('projectContacts')` matching by prefix (`projectContacts[0].*`, `projectContacts[1].*`) is `useValidatePartialForm`'s existing, unmodified behavior; this story's tests should include at least one page-path case shaped like a repeatable page's static name to document that the composable never needs the old `field.path.includes('[')` guard.

### Out of scope
- Any docs/template consumption of the composable (ST-02, ST-03).
- Building or shipping a stepper/progress UI component.
- Any change to `useDynamicForm`, `useValidatePartialForm`, or `validateSection` itself; this composable calls a `validateSection`-shaped function passed in and does not reimplement it.
- Multi-wizard-per-provider-subtree support; documented as a known constraint (AC21), not solved here.
- Any change to `correctMetadataAndSetDefaults` or `DynamicForm`'s internal tree-walking.

## Design reference
None. Per the feature spec's Design section, `useFormWizard` is a headless, type-level/engine composable with no visual surface of its own; the feature skipped the design phase entirely and this story inherits that (no prototype exists to link).

## Architecture reference
This story is Slice A in full: the feature architecture's "core composable (engine)" seam. Depends on nothing; carries the changeset and the `specs/components.md` update.

- **New file:** `packages/core/src/core/useFormWizard.ts`, exporting `useFormWizard` and `useFormWizardContext`, following the existing `packages/core/src/core/useDynamicForm.ts` / `useValidatePartialForm.ts` file layout and JSDoc style.
- **Provide/inject:** `useFormWizard` calls `provide()` internally under one internal (non-exported) `Symbol`, modelled directly on `dynamicFormSettingsKey` in `packages/core/src/types/DynamicFormSettings.ts` (ADR-2, ADR-4). `useFormWizardContext()` is the only exported way to read it (the Symbol itself is never exported), per ADR-3.
- **Path derivation clarification (settled here, not left for the developer to guess):** `DynamicForm.vue:75-76`'s formula is `fieldName = fieldMetadata.name ?? 'field-${index}'`, `fieldPath = fieldMetadata.path ?? [parent?.path, fieldName].filter(Boolean).join('.')`. Because `useFormWizard`'s first argument (Q1, decided) is `wizardNode.children` and never the wizard node or anything above it, this composable's `parent` is structurally always `undefined`, which collapses its own derivation to `fieldPath = page.path ?? (page.name ?? 'field-${index}')`. This is not a shortcut invented for this story; it is the same formula with the one input (`parent`) fixed at `undefined` because that is genuinely all the information this composable ever has. It is why the demo's wizard root explicit `path: ''` "just works" (an empty-string parent prefix and an absent parent prefix collapse to the same join result) and why a genuinely nested wizard's pages need an explicit `path` per page (AC4) rather than an implicit ancestor lookup the composable has no way to perform. Document this reasoning inline as a code comment on the derivation function (without citing this spec), so a future reader of the source understands why there is no `parent` parameter.
- **Options bag (`FormWizardOptions`):** `{ validateSection: (path: string) => Promise<FormValidationResult<GenericObject>>, onSubmit?: () => unknown, allowForwardJump?: boolean, validateOnJump?: boolean }`. The `validateSection` shape matches `useDynamicForm`'s returned `validateSection` exactly (import the type from vee-validate/`useValidatePartialForm` rather than redeclaring it).
- **Return type (`FormWizardContext`):** `{ currentStepIndex: Ref<number>, pages: ComputedRef<FormWizardPage[]>, isFirst: ComputedRef<boolean>, isLast: ComputedRef<boolean>, isValidating: Ref<boolean>, next: () => Promise<boolean>, prev: () => void, gotoStep: (index: number) => void | Promise<void>, submit: () => Promise<void> }`.
- **`FormWizardPage`:** `{ path: string, label?: MaybeRefOrGetter<string | undefined>, description?: MaybeRefOrGetter<string | undefined> }`. Per finding 6 (nit), `description` is made reactive-capable the same as `label` rather than a plain `string`, for internal consistency; no functional requirement forces this, it just removes an unexplained asymmetry.
- **Reused as-is, unchanged:** `useDynamicForm`, `useValidatePartialForm`, `validateSection`. This composable calls the function it is given; it never injects form context itself and inherits whatever context-resolution the caller's own `useDynamicForm()`/`useValidatePartialForm()` already has (Constraints section).
- **`specs/components.md`:** add a "Composables & core" row for `useFormWizard`/`useFormWizardContext`, and a Types-section mention for `FormWizardPage`/`FormWizardOptions`/`FormWizardContext`, plus the one-wizard-per-provider-subtree constraint (AC21).
- **Changeset:** `minor`, additive-only exports (AC22).
- **Tests:** unit tests under `packages/core/src/core/__tests__/useFormWizard.test.ts` (mirroring the single-file convention already used for `useValidatePartialForm.test.ts`), covering every AC above with a stubbed `validateSection`/`onSubmit`, no real `DynamicForm`/vee-validate mount required for most cases; AC18/19 (provide/inject) need a minimal two-component mount (parent providing, child injecting) via `@vue/test-utils`, consistent with how `useValidatePartialForm.test.ts` already mounts components to exercise `provide`/`inject`.
- **Dependencies:** none. This story can implement, be reviewed, and ship independently of ST-02/ST-03.

## QA plan

### Test file

One file, per this story's own Architecture reference ("mirroring the single-file convention already used for `useValidatePartialForm.test.ts`"): `packages/core/src/core/__tests__/useFormWizard.test.ts`. Suffix `.test.ts` (general/behavioral), matching `useValidatePartialForm.test.ts`'s own suffix. No `.logic.test.ts` split: this composable's entire surface is state and navigation behavior, and CLAUDE.md's `.logic.test.ts` convention is used to separate logic from validation/analytics concerns within a source file's test set, not to fragment a single small composable. No `.validation.test.ts` (this story adds no XSD rule). No `.analytics.test.ts` (see Reactivity below). Organized as one `describe('useFormWizard')` with nested `describe` blocks per concern (page-path derivation, `next`, `prev`, `isFirst`/`isLast`, `gotoStep`, `submit`, `isValidating`, `useFormWizardContext`, public exports), so each acceptance criterion maps to a named `it` inside a clearly-scoped block.

### New test utilities needed (local to this file, no shared fixture exists for a headless composable)

1. **`withSetup<T>(composable: () => T)`** — mounts a throwaway component whose `setup()` calls the composable and captures the result via closure. Needed because `useFormWizard` calls `provide()` internally (ADR-4), which requires an active component instance; a bare `useFormWizard(...)` call outside `setup()` would throw/warn. Standard pattern for unit-testing a Vue composable in isolation:

   ```ts
   function withSetup<T>(composable: () => T) {
     let result!: T;
     const Harness = defineComponent({
       setup() {
         result = composable();
         return () => null;
       },
     });
     const wrapper = mount(Harness);
     return { result, wrapper };
   }
   ```

2. **`createDeferred<T>()`** — a manually-releasable promise, for AC16/AC17's timing assertions:

   ```ts
   function createDeferred<T>() {
     let resolve!: (value: T) => void;
     const promise = new Promise<T>((res) => { resolve = res; });
     return { promise, resolve };
   }
   ```

3. **Stub `validateSection`/`onSubmit` factories**, matching vee-validate's `FormValidationResult<GenericObject>` shape (the same shape `useValidatePartialForm.ts` returns), reused across most tests:

   ```ts
   const validSection = vi.fn().mockResolvedValue({ valid: true, results: {}, errors: {}, source: 'fields' });
   const invalidSection = vi.fn().mockResolvedValue({ valid: false, results: {}, errors: { x: 'required' }, source: 'fields' });
   ```

No existing fixture is needed for most cases: per this story's Architecture reference, "no real `DynamicForm`/vee-validate mount required for most cases" — `validateSection`/`onSubmit` are stubbed functions here, not a real form context, so `packages/core/src/examples/TestForm(Template)` stays unused by this story. Only AC18/AC19 need a two-component mount, and it is two bare `defineComponent`s (parent providing, child injecting), not `DynamicForm` — the same mounting technique `useValidatePartialForm.test.ts` already uses to exercise `provide`/`inject`, minus the real engine since this composable never touches vee-validate itself.

### Acceptance criteria → test mapping

Page-path derivation (`describe('pages')`):
1. AC1 — fixture `[{ name: 'a' }, { name: 'b', path: 'explicit.path' }]`; assert `wizard.pages.value[1].path === 'explicit.path'` (not `'b'`).
2. AC2 — fixture `[{ name: 'company' }]`; assert `wizard.pages.value[0].path === 'company'`.
3. AC3 — fixture `[{ name: 'a' }, { path: 'b' }, {}]`; assert the third page's `path === 'field-2'` (position-based index, not count of nameless items).
4. AC4 — fixture `[{ path: 'outer.wizard.company' }]` (a page whose real ancestor path is non-empty, standing in for a nested wizard); assert `wizard.pages.value[0].path === 'outer.wizard.company'` verbatim. Documents the nested-wizard, explicit-path-only contract even though it exercises the same code path as AC1.
5. AC5 — fixture of 4 pages mixing explicit `path`, `name`-only, and neither, in a fixed order; assert `wizard.pages.value.length === 4` and `wizard.pages.value.map(p => p.path)` equals the expected array **in that order**, so an index-for-index comparison is pinned, not just set membership.
   - Edge case (repeatable-page path shape): fixture `[{ name: 'projectContacts', maxOccurs: 3 }]`; assert `wizard.pages.value[0].path === 'projectContacts'` with no `[` in it, documenting that this composable never needs the old `field.path.includes('[')` guard.
   - Edge case (`MaybeRefOrGetter` source): three variants of the same fixture — plain array, `ref([...])`, and a getter `() => source.value` — each pushed a new page after mount, asserting `wizard.pages.value` picks up the change for the `ref`/getter variants (live) and stays fixed for the plain-array variant (not reactive, expected).

`next()` (`describe('next')`):
6. AC6 — `validSection` stub; `await wizard.next()` resolves `true`; `currentStepIndex.value` incremented by exactly 1.
7. AC7 — `invalidSection` stub; `await wizard.next()` resolves `false`; `currentStepIndex.value` unchanged.
8. AC8 — 4-page wizard, `currentStepIndex.value` set to 2 before calling; assert the stub was called with exactly `wizard.pages.value[2].path`, via `expect(validSection).toHaveBeenCalledWith(wizard.pages.value[2].path)`.
9. AC9 — `currentStepIndex.value` at `pages.length - 1`, `validSection` stub; call `next()`; assert `currentStepIndex.value` stays at `pages.length - 1` (does not go out of range).
   - Extra (defensive-path coverage, not a named AC): `validateSection` stub that **rejects**; assert `next()` does not leave `currentStepIndex` advanced and does not leave `isValidating` stuck `true` (see AC16 note on `finally`-block coverage below).

`prev()` (`describe('prev')`):
10. AC10 — two cases: `currentStepIndex.value = 2` → `prev()` → `1`; `currentStepIndex.value = 0` → `prev()` → stays `0`.

`isFirst` / `isLast` (`describe('isFirst / isLast')`):
11. AC11 — 4-page wizard, three positions asserted: index 0 (`isFirst: true, isLast: false`), index 2 (both `false`), index 3 (`isFirst: false, isLast: true`).
   - Edge case (zero pages): `useFormWizard([], opts)` must not throw; `isFirst.value === true`, `isLast.value === false`.
   - Edge case (single page): `isFirst.value === true` and `isLast.value === true` at index 0.

`gotoStep()` (`describe('gotoStep')`):
12. AC12 — two cases on a 4-page wizard: `currentStepIndex.value = 3`, `gotoStep(1)` → moves to `1`; `currentStepIndex.value = 1`, `gotoStep(3)` with no options → stays at `1`.
   - Boundary case: `gotoStep(currentStepIndex.value)` (jump to the same index) is treated as backward (`<=`) and does not throw or misbehave, pinning the `<=` vs `<` boundary explicitly since the spec's prose ("backward-only") is otherwise ambiguous on the equal case.
13. AC13 — `allowForwardJump: true`: forward `gotoStep` moves. Two more cases for the documented `validateOnJump` interaction ("same pattern as `next()`'s gating"): `allowForwardJump: true, validateOnJump: true` with `validSection` → jump succeeds and `validateSection` was called with the *current* (pre-jump) page's path; same options with `invalidSection` → jump does not happen and `currentStepIndex` is unchanged. **Flag for adversarial review**: the spec explicitly defers the exact interaction to implementation ("settle the exact interaction during implementation"); the test above encodes the most literal reading of the spec's own parenthetical and is not itself a spec gap, but the reviewer should confirm this reading is what should be pinned before it hardens into a regression test.
14. AC14 — three cases: negative index (`gotoStep(-1)`) does not move; out-of-range index (`gotoStep(pages.length)`) does not move; both re-asserted with `allowForwardJump: true` set, to confirm the range guard applies independently of the forward-jump opt-in.
   - Coverage note: also assert `allowForwardJump: true` still allows a **backward** jump (guards against an implementation that reads the flag as "forward-only" instead of "also allow forward").

`submit()` (`describe('submit')`):
15. AC15 — stub `onSubmit = vi.fn().mockResolvedValue(undefined)`; `await wizard.submit()`; assert `onSubmit` called exactly once.

`isValidating` (`describe('isValidating')`):
16. AC16 — `createDeferred()` stands in for `validateSection`; call `wizard.next()` without awaiting; assert `wizard.isValidating.value === true` synchronously (before the deferred resolves); call `deferred.resolve({ valid: true, ... })`, `await` the outstanding `next()` promise; assert `wizard.isValidating.value === false`.
17. AC17 — identical pattern with `createDeferred()` standing in for `onSubmit`, asserting around `wizard.submit()`.
   - Extra (defensive-path coverage): repeat AC16's pattern with a deferred that **rejects**; assert `isValidating.value` still returns to `false` after the rejection is caught/awaited (pins a `try/finally`-shaped implementation rather than a bare `try` that would leave `isValidating` stuck `true` on error). Same for AC17's `onSubmit` reject case.
   - Non-blocking behavior note (edge case, not a strict pass/fail assertion): calling `next()` twice back-to-back without awaiting the first is documented as **not required to debounce**; one light test calls it twice against a `createDeferred()` stub and asserts only that neither call throws and `validateSection` was invoked twice (documents the "no dedup" contract so a future debounce change is a deliberate, visible diff here, not a silent behavior change).

`useFormWizardContext` (`describe('useFormWizardContext')`):
18. AC18 — two-component mount: `Parent` calls `useFormWizard(pages, { validateSection: validSection })` and exposes it; `Child` calls `useFormWizardContext()` and exposes the result. After mount, call `next()`/`gotoStep()` on the **child's** injected object and assert the **parent's** own `wizard.currentStepIndex.value` changed too (same object, not a copy) — read both off `wrapper.vm`/`wrapper.findComponent(Child).vm` the same way `useValidatePartialForm.test.ts` reads `(wrapper.vm as any)`.
19. AC19 — mount a standalone component whose `setup()` only calls `useFormWizardContext()` with no ancestor providing; assert `expect(() => mount(Orphan)).toThrow(/useFormWizard/i)` (message must name `useFormWizard`, not a generic injection error).

Public surface (`describe('exports')`):
20. AC20 — `import * as lib from '@/index'`; assert `typeof lib.useFormWizard === 'function'` and `typeof lib.useFormWizardContext === 'function'`. The "no existing export changes" half of AC20 is not a unit-testable assertion; it is covered by the Regression risk section below (full `pnpm ci` green, every pre-existing test file unmodified and passing).

Process (manual, not unit tests — see Manual verification checklist):
21. AC21 — `specs/components.md` documentation check.
22. AC22 — changeset presence/bump-type check.

### States policy (this slice)

Not applicable. Per the feature spec's Design section, `useFormWizard` is a headless composable with no visual surface; the feature explicitly skipped the design phase and named no states policy for this story to apply. Noted here so the absence isn't mistaken for a gap.

### Reactivity / `*.analytics.test.ts` plan

Not applicable, and deliberately so. The `analytics`/render-count mechanism (`data-testid="<path>-analytics-render-count"`) instruments `DynamicFormItem`'s own `computed()` re-evaluation inside a mounted `DynamicForm` tree. This story never touches `DynamicFormItem`, `computedProps`, or validation wiring: `useFormWizard` calls a `validateSection`-shaped function it is handed, it does not register fields, run `computedProps`, or render into a template. `wizard.pages` is a plain `computed()` over a small array with no loop-guard surface comparable to `assertNoComputeLoop()`; a render-count regression here is not a risk category this composable introduces. The `MaybeRefOrGetter` reactivity edge case (item 5 above) covers the one reactivity contract this story does make: `pages` recomputes when its source changes.

### Coverage

Expected to keep `pnpm -r ci:test:coverage` at or above baseline: this is 100% new code in one new file with no branch structurally unreachable by the tests above. Branches specifically called out to make sure they are hit (not left to incidental coverage):
- `gotoStep`'s four-way combination of `allowForwardJump` × `validateOnJump` (AC13, AC14's forward-jump-still-range-checked case).
- The `next()`/`submit()` reject paths (the "Extra" items under `next()` and `isValidating` above) — without an explicit reject-path test, a `try` without `finally` around `isValidating` would ship uncaught by the happy-path tests alone.
- The zero-pages and single-page edge cases, since `isLast`'s `currentStepIndex === pages.length - 1` becomes `0 === -1` only at zero pages, an easy off-by-one to leave uncovered.
- `useFormWizardContext`'s throw path (AC19) — easy to accidentally leave as a silent `undefined` return that only the type system would catch, not runtime.

Nothing in this plan is knowingly left uncovered. If the implementation ends up with a defensive branch not reachable through the public API (e.g. an internal invariant assertion), the developer should note it in Implementation notes rather than leave it silently uncovered.

### Time sensitivity

Not applicable. No date/time-dependent logic anywhere in this composable; the suite still runs under `TZ=Europe/Amsterdam` per the CI scripts, but no test in this plan asserts on wall-clock behavior.

### Regression risk

- **`packages/core/src/index.ts`** — gains one new export line (`export * from '@/core/useFormWizard'`). Regression risk is a name collision with an existing export; none exists (`useFormWizard`, `useFormWizardContext`, `FormWizardPage`, `FormWizardOptions`, `FormWizardContext` are all new identifiers, confirmed against `specs/components.md`'s current inventory). Guarded by `pnpm typecheck` (a collision would be a compile error) and by AC20's export test.
- **`useDynamicForm` / `useValidatePartialForm` / `validateSection`** — untouched by this story (Architecture reference: "Reused as-is, unchanged"). Guarded by their own existing, unmodified suites: `useValidatePartialForm.test.ts` and any `useDynamicForm` tests, which this story does not edit and must stay green under `pnpm ci`.
- **No other story of this feature is affected in the other direction**: ST-02/ST-03 depend on this story's output but this story has no dependency back on them, so there is nothing here to break by their later changes; this story's own suite is the regression guard ST-02 inherits when it starts consuming `useFormWizard`.
- **`DynamicForm.vue`'s path-derivation logic (`correctMetadataAndSetDefaults`, lines ~75-76)** is the source this composable's derivation replicates (ADR-1, by design duplication, not a shared helper). It is not modified by this story, so its own existing tests are the regression guard that the *engine's* path derivation itself stays correct; this story's page-path tests guard only the composable's copy staying in sync in *behavior*, not in source.

### Manual verification checklist

- **AC21**: after implementation, read `specs/components.md` and confirm it has a "Composables & core" row for `useFormWizard`/`useFormWizardContext`, and that the one-wizard-per-provider-subtree constraint (a second `useFormWizard()` call, or a nested wizard-inside-a-wizard-page, silently injects the wrong outer wizard with no error) is stated in prose there, not only in this spec.
- **AC22**: confirm a `.changeset/*.md` file exists on the branch with a `minor` bump for `@bach.software/vue-dynamic-form`, and that its description matches the additive export set (no unrelated changes bundled in).
- No visual/UI verification needed (headless composable, no Playwright screenshot applicable).

### Flags for reviewer

- AC13's `validateOnJump` interaction (see item 13 above): confirm the literal reading used for the test ("gates on the *current* page's `validateSection` before the jump, same call shape as `next()`") is the right one to harden, since the spec text itself defers this to implementation.
- AC19's exact throw behavior (synchronous throw during `setup()` propagating through `mount()`) assumes no app-level Vue error handler swallows it in the real test environment; confirmed as the expected `@vue/test-utils` behavior for an uncaught `setup()` error with no `app.config.errorHandler` registered, but worth the developer double-checking against the installed `@vue/test-utils` version if the test does not throw as written.

## Adversarial review

STORY mode (blockers only). No blockers found. The two items the qa-planner flagged were verified against the actual sources and are both resolvable without Jeroen; the remainder are nits.

Verified (not findings):

- **Path-derivation clarification is a correct specialization, not a silent override.** Checked `packages/core/src/components/DynamicForm.vue:75-76`: `fieldName = fieldMetadata.name ?? 'field-${index}'`, `fieldPath = fieldMetadata.path ?? [parent?.path, fieldName].filter(Boolean).join('.')`. With Q1 decided (option b: the composable receives `wizardNode.children`, never the node or its ancestors), `parent` is structurally always `undefined`, so `[undefined, fieldName].filter(Boolean).join('.')` collapses to `fieldName`, giving `page.path ?? (page.name ?? 'field-${index}')`. This is the same formula with one input fixed, not a shortcut, and it reproduces the engine's registered path: the engine joins each page against the wizard root's explicit `path: ''` (confirmed at `FormExampleClientOnboardingPlanner.vue:205`), and `Boolean('')` is `false`, so an empty-string parent prefix and an absent parent prefix produce the identical result. Consistent with feature ADR-1 and the DECIDED Q1. AC4's explicit-path-only nested-wizard contract follows correctly (the composable has no `parent` to join against, so a deeper wizard's pages must carry an explicit `path`).
- **AC19's synchronous-throw test is achievable.** Installed Vue is `>=3.5.18`. In dev mode (Vitest's default), Vue re-throws errors thrown synchronously in `setup()` by default (`handleError` -> `logError` with `throwInDev = true`), and `@vue/test-utils` `mount()` installs no `errorHandler` that swallows it, so `expect(() => mount(Orphan)).toThrow(/useFormWizard/i)` propagates as written. `inject()` itself does not throw on a missing provider (it returns `undefined`), so `useFormWizardContext()` must throw its own `Error` explicitly, which AC19/QA-item-19 already require. The story's own flag (QA "Flags for reviewer") hedges this correctly.
- **Stub shape matches reality.** The QA plan's `validateSection` stub `{ valid: true, results: {}, errors: {}, source: 'fields' }` is exactly what the real `useValidatePartialForm.validateSection` returns (confirmed against `useValidatePartialForm.ts:64-69` and its test at `useValidatePartialForm.test.ts:32-38`, including the "empty match -> valid: true" behaviour, which is the same footgun feature-finding-1 guards against).
- **Dependencies are explicit and correct.** ST-01 is Slice A, depends on nothing (Architecture reference, Regression risk); ST-02/ST-03 depend on it, matching the feature's Stories table. No back-dependency.
- **AC-to-QA mapping is complete.** All 22 ACs map to a named test or a manual check; the non-unit-testable parts (AC20's "no existing export changes" half, AC21 components.md, AC22 changeset) are correctly routed to Regression risk / Manual verification rather than claimed as unit assertions.

Findings:

1. **[NIT] AC13's `validateOnJump`/`allowForwardJump` interaction was described as developer discretion while the QA plan already pins it.** `validateOnJump` is a published option, so its behaviour is a contract, not an implementation whim. The QA plan (item 13) already pins the correct reading (validate the current/pre-jump page, then jump, mirroring `next()`), which is confirmable via the post-approval ladder rung 3 (match the existing `next()` gating pattern). Routed as a `PROPOSED (adversarial review)` note on AC13 that promotes the pinned reading to the contract and removes the "settle during implementation" softening. Resolvable without Jeroen; does not force discussion.

2. **[NIT] `isValidating` behaviour during a `gotoStep` + `validateOnJump` gate is unspecified.** AC16/AC17 pin `isValidating` around `next()` and `submit()`, but the `validateOnJump` path also awaits `validateSection` and the return type exposes a single `isValidating`. A consumer using `validateOnJump` to gate a forward jump would reasonably expect the same spinner signal. Suggested resolution: have `gotoStep`'s `validateOnJump` gate toggle `isValidating` the same way `next()` does, and add a one-line assertion to QA item 13. Not blocking; the composable is still correct without it.

3. **[NIT] `next()`'s return value at the last page (AC9) and `submit()` with an undefined `onSubmit` are unspecified.** AC9 pins that `currentStepIndex` does not advance past the last page, but not what `next()` resolves to there (`true` because validation passed, or `false` because no advance happened); AC6/AC7 tie the boolean to validation outcome, so `true` is the consistent choice. Separately, `onSubmit` is optional in `FormWizardOptions` while AC15 assumes it is present; define `submit()` as a no-op (resolving) when `onSubmit` is absent, or make the field required. Suggested resolution: pin both in the implementing story's notes; neither changes the public shape. Not blocking.

**Status: awaiting-approval.** No unresolved open questions (feature Q1-Q5 all DECIDED), no blockers, and the only findings are nits (finding 1 additionally routed as a PROPOSED edit). Per the mechanical rule this lands in `awaiting-approval`, not `awaiting-discussion`.
