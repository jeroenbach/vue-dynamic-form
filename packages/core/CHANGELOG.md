# @bach.software/vue-dynamic-form

## 0.6.0

### Minor Changes

- 01be12d: Refine attribute-field unmount behaviour: an attribute (a field's `attributes` entries) now only clears unconditionally on unmount when its owning field's own value is gone. When the owning field still has a value (for example a `v-if`-hidden subtree, or a whole-form unmount) the attribute follows the same `keepValuesOnUnmount` / `fieldOptions.keepValueOnUnmount` rules as any other field, instead of always clearing. Adds an optional `attributeOwnerHasValue` prop to the publicly exported `DynamicFormItemProps`, used internally alongside `partOfAttributeField` to check the owner's current value at unmount time.
- 3634a44: Add `xsd_choiceMaxOccurs` and `vdf_maxOccursTotal`, two new globally-registered validation rules that fail when a choice field (`DynamicFormItemChoice`) already holds more occurrences than its declared `maxOccurs`, or a branch already holds more raw items than its own opt-in `maxOccursTotal` cap, for example when `initialValues`, an API response, or an import loads data over the limit. Previously both over-limit states only had their "Add" affordance disabled; the state itself never surfaced as a validation error.

  - `xsd_choiceMaxOccurs` compares the choice's used occurrence units (not raw item count) against `maxOccurs`, in both automatic and explicit selection modes. When it fails together with the minimum rule, the minimum message wins the displayed error.
  - `vdf_maxOccursTotal` is a non-XSD extension, carrying the library's `vdf_` prefix instead of `xsd_` (the prefix also keeps the shared global vee-validate rule registry free of collisions with consumer-defined rules). It fires when any branch's raw occurrence count exceeds that branch's own `maxOccursTotal`, reports the first offending branch's cap in declaration order, and never names the offending branch. A single-branch choice reports through the branch's own `xsd_maxOccurs` error instead.
  - A branch's `maxOccursTotal` can only tighten its declared `maxOccurs`, never widen it, in every selection mode.
  - Data loaded over a choice's shared occurrence budget no longer punishes innocent branches: every branch holding values stays editable and never shows a shifting budget-relative (or negative) cap error, so the choice-level error can always be resolved through the UI.

  Adds optional `messages.choiceMaxOccurs` and `messages.maxOccursTotal` keys to `DynamicFormSettings` (placeholders `{field}`, `{0}` or `{max}`), resolved through the existing `settings.messages` → vee-validate `generateMessage` → rule default priority chain.

  Additive and inert until a choice is loaded over its declared `maxOccurs`, or a branch over its declared `maxOccursTotal`; existing forms are unaffected.

- a6998d5: Let a template control how the occurrences of a repeatable explicit choice ("add several, each one of several kinds") are numbered and ordered on screen, so the user sees one continuous list in the order they built it, rather than items that restart their numbering per kind and always sit grouped by kind.

  Everything here is opt-in and layers on top of FEAT-001's `explicitChoiceSelection`: the default numbering, order, and storage of a repeatable choice are unchanged, so existing consumers are unaffected. What you can now build:

  - **Continuous "item N of M" numbering across kinds**: the new `globalIndex` slot prop on `*-choice-array-item` / `default-choice-array-item` reports each occurrence's position across every branch (not just within its own kind), renumbering live on add and remove, so a badge can read 1, 2, 3, 4 regardless of which kinds were added.
  - **Show occurrences in the order they were added, this session** (opt-in `displayOrder: 'added'`): render occurrences interleaved by add-press order instead of grouped by kind. Backed by an ephemeral `insertionOrder` slot prop that lives only in memory, never in form values, and falls back to grouped order after a reload. Flipping the flag re-sorts in place without a remount.
  - **Persist that add-order into the saved data** (opt-in `preserveOrder`): write a 1-based `order` field into each occurrence's own values, kept contiguous 1..N as occurrences are added and removed, and normalized from loaded data at mount. Unlike `insertionOrder`, this survives a reload and saved data, at the cost of appearing in `values`. Requires every branch to have `children` (an object to hold the field); a scalar-leaf branch disables it for the whole choice with a development warning.

  Neither ordering flag changes `xsd_choiceMinOccurs` or occurrence-budget outcomes, and the storage model stays per-branch. Additive throughout: a choice that opts into none of these renders exactly as before.

- 6d893c4: Let a template show a selector first ("what kind of data do you want to enter?") and reveal a choice branch's fields only after the user picks it, instead of requiring at least one field to already hold a value before the branch counts as selected. This replaces the hidden-phantom-field workaround previously needed to fake a selection.

  Add the opt-in `explicitChoiceSelection` field metadata flag, plus the slot props to drive it (`addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences`, `usedChoiceOccurrences`). What you can now build:

  - **Pick one, then fill in** (`maxOccurs: 1`): mark a branch selected before any of its fields hold a value, driven from the `-choice` slot.
  - **Add several, each one of several kinds** (`maxOccurs > 1`): add and remove occurrences of chosen branches, rendered through new `*-choice-array` / `*-choice-array-item` slots. Both fall back to the existing `*-choice` / `*-array-item` slots when a template doesn't define them, so a generic array-item card renders occurrences out of the box.
  - **Keep data across a switch** (opt-in `preserveOnSwitch`): when the user switches away from a `maxOccurs: 1` branch and back, restore what they had entered instead of clearing it. Values are stashed in an ephemeral, instance-local clone that is never written to form `values`.
  - **Per-kind ceiling** (opt-in `maxOccursTotal`): cap a single branch's occurrence count independently of the shared choice budget, a "at most 3 of this kind" limit with no XSD equivalent.

  Occurrence counting follows the same XSD-faithful rule the library already uses for automatic choice mode: a branch's own `maxOccurs` is the batch size within the shared choice budget (every group of up to that many raw items consumes one shared slot), not an independent total, and it is validated in the same choice-occurrence units as `xsd_choiceMinOccurs`.

  Additive and opt-in throughout: existing choices with none of these flags set render exactly as before.

- 01be12d: Fix `keepValuesOnUnmount` (and the per-field `fieldOptions.keepValueOnUnmount`) so it actually works: unmounting a field no longer unconditionally clears its value, which previously overwrote whatever vee-validate had decided to keep. Attribute fields (a field's `attributes` entries) still always clear on unmount, since they are conditionally mounted based on whether their parent has a value. Adds an optional `partOfAttributeField` prop to the publicly exported `DynamicFormItemProps`, used internally to mark those attribute fields.
- 3634a44: Add `xsd_maxOccurs`, a new globally-registered validation rule that fails when an array field (`DynamicFormItemArray`) already holds more raw items than its declared `maxOccurs`, for example when `initialValues`, an API response, or an import loads data over the limit. Previously an over-limit array only had its "Add" affordance disabled; the state itself never surfaced as a validation error.

  The rule counts raw items including empty placeholders, the same quantity the "Add" affordance's cap already governs, so the rule and the UI never disagree. A field failing both the minimum and the maximum shows the minimum message first. The error surfaces on first interaction or on submit, never eagerly on mount, matching every other occurrence rule. Metadata declaring `minOccurs` greater than `maxOccurs` stays silently tolerated, as before, instead of producing an error the form can never resolve.

  Adds an optional `messages.maxOccurs` key to `DynamicFormSettings` (placeholders `{field}`, `{0}` or `{max}`), resolved through the existing `settings.messages` → vee-validate `generateMessage` → rule default priority chain.

  Additive and inert until an array is loaded over its declared `maxOccurs`; existing forms are unaffected.

- 47bed43: Build multi-step ("wizard") forms by adding one metadata property. Wizards are a common pattern, but until now the engine had no concept of one: you had to hand-roll step state, per-page validation, and path bookkeeping in your own template. Now you mark a node with `wizard: true` and the engine drives the steps for you.

  - The wizard node's `children` become its ordered steps.
  - Step state and navigation arrive as slot props on a new `-wizard` / `-wizard-page` slot family (`currentStepIndex`, `pages`, `isFirst`, `isLast`, `isValidating`, `wizardConfig`, `next()`, `prev()`, `gotoStep()`), the same channel choice and array shapes already use. No composable, no provide/inject, no callbacks stored in metadata. `wizardConfig` is the resolved navigation config (defaults applied) so a stepper can reflect the mode, e.g. enabling forward jumps when `allowForwardJump` is set.
  - Attributes bound on the wizard slots' own `<slot />` elements flow into the page content's `slotProps`, exactly like at every other template level. Binding `:gotoStep="gotoStep"` on the page wrapper's slot is how a summary page renders per-section "edit" links that jump back to an earlier step. Stable bindings are free: page fields only re-render on navigation when a bound value actually changed.
  - By default a wizard is linear: `next()` validates the current step and blocks so users cannot skip past errors, and the stepper only jumps backward to visited steps. Pass a `WizardConfig` object (`{ allowForwardJump, validateOnJump }`) instead of `true` to make it non-linear, letting the user move ahead even with an invalid step. In that mode both `next()` and forward `gotoStep()` still surface the step's errors but no longer block; set `validateOnJump: false` for a silent jump that moves without validating.
  - Submit stays yours: the engine exposes `isLast` so your template knows when to show a submit button, which you wire to `handleSubmit` from `useDynamicForm` as usual.

  Important for template authors: wizard page slots must gate visibility with `v-show`, never `v-if`. Every page stays mounted at once, so a `v-if` would unmount a page's fields and clear their values (and deregister their validation) the moment the user navigates away.

  Fully additive: `wizard` is a new optional `FieldMetadata` property, and every existing form and template keeps working unchanged.

### Patch Changes

- 47bed43: Fix a false "Possible infinite loop detected in computedProps" error that could permanently freeze a field's rendering. Value updates arriving faster than a macrotask (paste, browser autofill, IME composition, automated typing) could starve the guard's timer-based reset, so legitimate once-per-update recomputes were miscounted as a loop and the thrown error killed the field's render effect, leaving stale metadata on screen while the form values kept updating. The guard's limit is now aligned with Vue's own recursive-update limit (100), far above any realistic input burst, while genuinely non-idempotent computedProps writes that recompute without ever letting the event loop turn are still caught.

## 0.5.0

### Minor Changes

- ad73109: Exported new utility helpers: `removeNullValues`, `checkTreeHasValue`, `mapEachMetadataItem`, and `setInPath`.

## 0.4.0

### Minor Changes

- aef251d: Extendable settings, now available in template slots

  - **`settings` in slots** — all template slots (`#default`, `#default-array`, `#default-choice`, `#group`, `#group-array`, etc.) now receive a `settings` prop, giving templates access to the active form settings without prop-drilling or `inject`.
  - **Extendable settings** — `defineMetadata()` accepts a new 4th generic `ExtendedSettingsProperties`, which is merged into the `DynamicFormSettings` type. This lets you add your own settings keys (e.g. `showOptionalInsteadOfRequired`) and have them fully typed end-to-end.
  - **`GetDynamicFormSettingsType` helper** — derives the correctly-typed `DynamicFormSettings` alias from a metadata configuration, analogous to `GetMetadataType`.

  **Breaking changes:**

  - The `#attributes` slot is now always rendered (visibility is controlled inside the slot). If your template relied on the slot being absent when the field had no attributes, move that guard inside your slot content.
  - `DynamicFormItemProps` no longer exposes `input`, `children`, `choice`, and `array` slot stubs — only `default` and `attributes` remain.
  - `ValidationRule` and related validation helpers are no longer re-exported from the package root.

## 0.3.0

### Minor Changes

- cb5b411: Improved defineMetadata() typing, reactive parent–child computedProps, partial form validation, auto-add first array item, and per-type array/choice slots.

  ## New features

  - **`slotProperties` in `defineMetadata()`** — `slotProps` is no longer a separate Vue prop on the
    template component; pass your slot properties as the third generic of `defineMetadata()` instead,
    where they are exposed through the `Attributes` slot as `slotProperties`. ⚠️ **Breaking for existing
    template components**: remove the hand-crafted `Props` interface from your template component and
    add it as a generic argument to `defineMetadata()`.
  - **`childFields` in `computedProps`** — `computedProps` functions now receive a `childFields` ref
    as their third argument, enabling parent fields to react to their children's computed state (e.g.
    hiding a parent when all children are hidden)
  - **`validatePartial()`** — new helper for validating a subset of form fields without triggering
    full-form validation; names/typing of related helpers improved
  - **Auto-add first array item** — array fields with `minOccurs > 0` now automatically insert the
    first occurrence on mount; opt out per-field with `addFirstItem: false`
  - **Per-type array/choice slots** — each field type can now define its own `{type}-array` and
    `{type}-choice` slots in `DynamicFormTemplate`, allowing per-type customisation of array and choice
    rendering without overriding the global slot

## 0.2.0

### Minor Changes

- a0c2763: Complete rewrite of @bach.software/vue-dynamic-form since v0.1.3.

  ## New features

  - **vee-validate integration** — full form state, submission handling, and field registration via `useField`
    / `useForm`; exposed through `useDynamicForm()`
  - **XSD-inspired validation** — built-in rules: `xsd_required`, `xsd_minLength`, `xsd_maxLength`,
    `xsd_length`, `xsd_pattern`, `xsd_minInclusive`, `xsd_maxInclusive`, `xsd_minExclusive`, `xsd_maxExclusive`,
    `xsd_enumeration`, `xsd_whiteSpace`, `xsd_fractionDigits`, `xsd_totalDigits`
  - **`computedProps`** — per-field reactive functions that run inside a `computed()` in the field component,
    allowing dynamic metadata changes (options, required state, visibility) without re-rendering the full tree;
    includes infinite-loop detection
  - **Array fields** — repeatable fields driven by `minOccurs` / `maxOccurs`; add/remove controls with
    occurrence tracking and min/max enforcement
  - **Choice fields** — mutually exclusive branches; once one branch has a value the siblings are disabled;
    supports nested groups and array choices
  - **Attribute fields** — secondary metadata fields rendered alongside a field once it has a value;
    automatically promotes the field to a complex type
  - **`DynamicFormSettings`** — configurable validation timing (`validateOnBlur`, `validateOnValueUpdate`,
    `validateOnValueUpdateAfterSubmit`, `validateWhenInError`) and overridable error messages with
    named/positional placeholders
  - **`defineMetadata()`** — typed configuration factory; connects field type names and extended field
    properties to `DynamicFormTemplate` slots with full TypeScript inference
  - **`GetMetadataType`** helper — derives the correctly typed `FieldMetadata` alias from a metadata
    configuration
  - Source maps included in the published build

## 0.1.3

### Patch Changes

- ea8448d: Updated readme to prevent downloads

## 0.1.2

### Patch Changes

- 8612186: Setup the basic solution with Storybook
  - Setup correct typing
  - Add Storybook stories for all components
  - Added Tailwind CSS support to the playground
  - Added ci/cd pipeline

## 0.1.1

### Patch Changes

- 9ec4840: Initial release
