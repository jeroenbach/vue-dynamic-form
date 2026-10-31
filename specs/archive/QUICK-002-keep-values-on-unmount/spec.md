---
id: QUICK-002
type: quick
status: done
approved_by: Jeroen
pr: ""
---

# Quick: make `keepValuesOnUnmount` work as documented

## Problem

`docs/reference/dynamic-form.md:64` documents `keepValuesOnUnmount` as "Preserve form values when the component unmounts" (default `false`), and `useDynamicForm` declares it in `FormOptions` (`packages/core/src/core/useDynamicForm.ts:22`) and forwards it straight into vee-validate's `useForm()`. In practice the option is a silent no-op for any field rendered through `DynamicFormItem`.

Mechanism, verified against vee-validate 4.15.1's installed source and the engine:

1. vee-validate's `useField` registers its own unmount hook first (the `useField` call sits at `DynamicFormItem.vue:130`, so its hook is registered before the component's `onBeforeUnmount` at line 408 and runs first). On unmount it computes `shouldKeepValue = field.keepValueOnUnmount ?? form.keepValuesOnUnmount`; when `true` it keeps the value in `form.values` (only removes path state), when `false` it unsets the path value entirely.
2. The engine's own `onBeforeUnmount` (`DynamicFormItem.vue:408-424`) then runs and explicitly writes `value.value = undefined` for every unmounting field except `partOfArrayField` items, which writes `undefined` back into `form.values` regardless of what vee-validate just decided.

The engine clear exists for one reason, stated in its own comment: **attribute fields** are conditionally mounted (`showAttributes` depends on whether the parent has a value, `DynamicFormItem.vue:290-292`) and must purge their value from form state when they unmount. But the clear is applied to all non-array fields, so the documented opt-in is unreachable: the library promises a behavior it then actively defeats.

Decided by Jeroen in conversation: `keepValuesOnUnmount` must work as the library promises, the attribute auto-clear functionality must keep working, and the choice between the two implementation options below is made by the test suite, not by argument.

## Proposed change

Test-first, in this order:

1. **Pin the current guarantees with tests before changing anything** (all against today's code, all must stay green after the fix):
   - an attribute field's value is cleared from `form.values` when it unmounts (parent value emptied);
   - a conditionally rendered (`v-if`) non-attribute field's value is gone from `form.values` after unmount under default settings (no keep flags);
   - a `computeOnChildValueChange` parent reacts to a child unmounting. This pins the one observable difference between the two cleanup code paths: the engine clear emits `update:modelValue` via `notifyValueUpdate()`, bumping the parent's `childValueReactivity`, while vee-validate's own unset does not go through that emit chain.
2. **Add the missing promise tests** (red today, green after the fix):
   - form-level `keepValuesOnUnmount: true` preserves a field's value in `form.values` across the field's unmount;
   - field-level `fieldOptions.keepValueOnUnmount: true` does the same for a single field;
   - attribute fields still clear on unmount **even when** the form-level flag is `true`.
3. **Implement the primary fix (Option A, the clean one):** add an optional `partOfAttributeField?: boolean` prop to `DynamicFormItemProps` (mirroring `partOfArrayField`), set it where the `#attributes` slot renders the attribute child items (`DynamicFormItem.vue:539-556`), and restrict the `onBeforeUnmount` clear to fields carrying it. All other fields defer to vee-validate's native unmount semantics (which the engine already forwards the flags into).
4. **Fallback (Option B) only if step 1's pinned tests reveal a real dependency** on the engine clear or its emit chain for non-attribute fields: keep the engine clear for the default case, but skip it when the effective keep flag is `true` (`fieldOptions.keepValueOnUnmount ?? form-level keepValuesOnUnmount`, the form-level value readable from the injected vee-validate form context), with attribute fields always clearing. Option B cannot regress the default path by construction. Record in this spec which option shipped and why.

> **PROPOSED (adversarial review): make the A-vs-B decision rule mechanical.** Implement Option A first and run the three step-1 pin tests. If all three stay green, ship Option A. If any pin test goes red under Option A, ship Option B (it preserves the engine clear and its emit chain for the default, keep-flag-false path). "Reveal a real dependency" is otherwise a judgement call the implementer should not have to make. Note also that Option B still needs the `partOfAttributeField` marker from step 3 to keep attribute fields clearing while a form-level `keepValuesOnUnmount: true` is set, so the prop addition is unconditional across both options, not specific to Option A.

Not in scope: any change to `DynamicFormItemChoice`'s explicit branch clearing or `preserveOnSwitch` stash (independent mechanisms), to `useFieldArray`-managed array-item removal (already exempt via `partOfArrayField`), or to FEAT-003's wizard `v-show` contract, which stands regardless: a `v-if`'d wizard page still deregisters its fields' validation even with values preserved, so preserved-but-unvalidated values on submit remain the reason pages must use `v-show`.

**`packages/core/src/` is touched**, so a changeset is required at implementation time: **minor** (see `DECIDED` note below).

> **PROPOSED (adversarial review): the bump is likely minor, not patch.** `DynamicFormItemProps` is a publicly exported type (`packages/core/src/index.ts:14` re-exports `@/types/DynamicFormItemProps`), so adding `partOfAttributeField?: boolean` grows the public API surface. CLAUDE.md maps "new export that is backwards compatible" to **minor**, and semver treats an additive optional member on an exported interface the same way. The behavior fix on its own is patch-worthy, but the new exported prop pushes the changeset to **minor**. Keep patch only if the team explicitly treats engine-coordination props (`partOfArrayField`, `partOfChoiceField`, `branchKey`, `partOfAttributeField`) as non-consumer API despite being exported; Jeroen decides.

> **DECIDED (research):** minor. `DynamicFormItemProps` is publicly exported (`index.ts:14`), and CLAUDE.md maps an additive change to the published type surface to minor. Claude recommended minor to Jeroen before he approved this spec, so the changeset shipped as minor.

## Affected files

- `packages/core/src/components/DynamicFormItem.vue` — `onBeforeUnmount` scoping (lines 408-424); `#attributes` slot rendering gains `:part-of-attribute-field="true"` on its child items (lines 539-556).
- `packages/core/src/types/DynamicFormItemProps.ts` — new optional `partOfAttributeField?: boolean` prop (public type, additive).
- `packages/core/src/components/__tests__/DynamicFormItem.logic.test.ts` — the pinned-guarantee and promise tests (or a dedicated `DynamicFormItem.unmount.logic.test.ts` if the suite reads better standalone; implementer's call, conventions allow both).
- `.changeset/*.md` — minor.
- `specs/components.md` — note the new `DynamicFormItemProps.partOfAttributeField` prop and the now-functional `keepValuesOnUnmount` behavior on the `useDynamicForm` row.
- Possibly `docs/reference/dynamic-form.md` — only if the shipped behavior needs a caveat sentence (attribute fields always clear); otherwise the existing text becomes true as written.

## Test impact

New tests as listed in Proposed change steps 1 and 2 (six scenarios: three pins, three promises). Existing suites (`DynamicFormItem.logic.test.ts`, `DynamicFormItem.validation.test.ts`, `DynamicFormItemArray.*`, `DynamicFormItemChoice.*`, `DynamicForm.test.ts`) must stay green untouched; they are the regression net that decides between Option A and Option B. Coverage must not drop (`pnpm -r ci:test:coverage`). Time-sensitive tests unaffected (no date logic involved).

## Adversarial review

Reviewed against the installed source (vee-validate 4.15.1, `packages/core/src`). The core premise checks out: I traced the engine clear at `DynamicFormItem.vue:421` (`value.value = undefined`) through vee-validate's field-value setter (`_useFieldValue`, `vee-validate.mjs:1126-1133`) into `setFieldValue` (`vee-validate.mjs:2623-2634`), which re-creates path state via `createPathState` and writes into `formValues` even after the field's own unmount hook decided to keep the value (`vee-validate.mjs:1817-1848`). So the engine does overwrite whatever vee-validate preserved, and `keepValuesOnUnmount` is genuinely a no-op through `DynamicFormItem`. Every line-number and structural claim I checked is accurate: `useField` at 130, `onBeforeUnmount` at 408-424, the `partOfArrayField` early return at 415-416, the `#attributes` slot at 539-556 (no marker prop today), `showAttributes` at 290-292, the `keepValuesOnUnmount` pass-through in `useDynamicForm.ts:22/41`, and `partOfAttributeField` is absent from `DynamicFormItemProps` today (additive). All named test suites exist, and pin #3 is constructible: `DynamicFormItem.logic.test.ts:429-483` already observes `computeOnChildValueChange` recompute deterministically via a `computedProps` counter plus `flushPromises`, and a child unmount emits `update:modelValue` synchronously in its `onBeforeUnmount` while the parent is still mounted, so the parent handler still fires. No blockers.

1. **should-fix — semver classification is probably wrong (patch vs minor).** `DynamicFormItemProps` is publicly exported (`index.ts:14`), so the new optional `partOfAttributeField` prop grows the published type surface; CLAUDE.md maps a backwards-compatible new export to **minor**. Resolution: routed as a `PROPOSED (adversarial review)` edit in the changeset paragraph proposing **minor** (or an explicit team decision to keep patch for engine-coordination props).

2. **should-fix — the A-vs-B decision rule is a judgement call, not a rule.** "Fallback only if step 1's pinned tests reveal a real dependency" leaves the implementer to decide subjectively which option ships. Resolution: routed as a `PROPOSED (adversarial review)` edit in step 4 restating it mechanically (ship A if all three pin tests stay green under Option A, else ship B).

3. **nit — the `partOfAttributeField` prop is framed as Option-A-specific but is needed by Option B too.** Option B must still distinguish attribute fields ("always clearing") from regular fields whose keep flag is `true`, which requires the same marker. Folded into the step-4 PROPOSED edit so the prop addition reads as unconditional. Low severity, no separate routing needed.

## Implementation notes

**Option B shipped.** Option A (restricting the `onBeforeUnmount` clear to `partOfAttributeField` fields, letting every other field defer entirely to vee-validate's native unmount handling) was implemented first and run against the three step-1 pin tests, per the mechanical rule. The third pin (`computeOnChildValueChange` parent observes a child unmounting) went red under Option A: with the engine's explicit clear and `notifyValueUpdate()` call removed for non-attribute fields, a parent with `computeOnChildValueChange: true` no longer received a second, up-to-date recompute after a plain child unmounted, so its own reactive snapshot of the child's value stayed stale even though vee-validate had already cleared the value in `form.values` underneath it. Vee-validate's own unmount handling does not route through this library's custom `update:modelValue` emit chain, so nothing else notifies the parent. Shipped Option B instead: the engine keeps its explicit clear and notify for the default (keep-flag-false) path on every field, and only skips it when the effective keep flag (`fieldOptions.keepValueOnUnmount ?? form-level keepValuesOnUnmount`, the form-level value read from the injected vee-validate form context) is `true`. Attribute fields always clear regardless, marked by the now-unconditionally-added `partOfAttributeField` prop.

All three pins and three promise tests pass under Option B (`packages/core/src/components/__tests__/DynamicFormItem.unmount.logic.test.ts`). One deviation: the third promise test ("attribute fields still clear even when the form-level flag is true") was already green against today's unmodified code, because the pre-fix engine clear was unconditional for every non-array field, attribute or not. It is kept as a forward-looking guarantee (it must keep passing after the fix, which it does), even though it was not strictly red beforehand like the other two promises.
