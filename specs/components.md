# Component & API inventory

Living inventory of the library's public surface. The spec-workflow agents consult this before proposing anything new; the developer updates it whenever a change touches the public surface (a new export, prop, slot, setting, or validation rule, or a behavioral change to one). Keep entries to one or two lines; the source and `CLAUDE.md`'s Architecture section carry the detail.

Everything listed as exported comes from `packages/core/src/index.ts` and ships in `@bach.software/vue-dynamic-form`. Changing any of it needs a changeset (see CLAUDE.md).

## Components (exported)

| Component | Role |
| --- | --- |
| `DynamicForm` | The runtime engine. Accepts `metadata` + a `template` component, normalises paths and defaults (`correctMetadataAndSetDefaults`), provides settings via provide/inject, renders the `DynamicFormItem` tree. |
| `DynamicFormItem` | The core recursive item. Registers with vee-validate (`useField`), evaluates `computedProps`, detects its shape (array / choice / parent / input) and delegates or renders into the template. The most complex file in the codebase. |
| `DynamicFormItemArray` | Renders repeatable nodes (`maxOccurs > 1`), one sub-tree per occurrence. |
| `DynamicFormItemChoice` | Renders mutually exclusive branches (`choice` non-empty). `explicitChoiceSelection: true` switches to selection-first rendering: no branch mounts until the `-choice` slot's `addChoiceOccurrence(branchKey)` is called (`removeChoiceOccurrence`/`canAddChoiceOccurrence`/`activeChoiceOccurrences` complete the set). Flag absent/`false` keeps today's value-driven behaviour unchanged. For `maxOccurs: 1`, selecting a branch marks it active and switching clears the deselected branch's data; `preserveOnSwitch: true` (opt-in, `maxOccurs: 1` only) stashes the deselected branch's values in an ephemeral, instance-local ref before clearing, and restores them on switch-back with fresh touched/validation state — the stash never enters form `values`. For `maxOccurs > 1`, `addChoiceOccurrence(branchKey)` pushes a real occurrence into that branch's own field array (via `useFieldArrayExtended`, over a reactive per-branch path so it stays correct when nested inside a reindexing array), `removeChoiceOccurrence(branchKey, index)` removes a specific occurrence, and `activeChoiceOccurrences` lists every active occurrence across branches grouped by branch declaration order then index within branch, derived purely from the value tree. Occurrence math follows XSD batching: a branch's own `maxOccurs` is the slot size, not an independent cap, so `canAddChoiceOccurrence` is governed by the shared choice-level budget alone (in raw-item units at that batch size), optionally tightened by the branch's opt-in non-XSD `maxOccursTotal`. `usedChoiceOccurrences` reports consumption in choice-occurrence units (`sum of ceil(branch item count / branch maxOccurs)`), the same unit `xsd_choiceMinOccurs` validates in. A single (`maxOccurs: 1`) choice renders its container through the `*-choice`/`default-choice` slot, a repeatable (`maxOccurs > 1`) choice through `*-choice-array`/`default-choice-array`, and each repeatable occurrence through the `*-choice-array-item`/`default-choice-array-item` slot, iterating an internal `renderedChoiceOccurrences` computed rather than `activeChoiceOccurrences` directly. `renderedChoiceOccurrences` equals `activeChoiceOccurrences` unless the branch's `displayOrder` metadata is `'added'`, in which case it is a deterministic two-key sort: occurrences added this session (tracked in an ephemeral, instance-local `insertionOrders` map keyed by the stable occurrence key, assigned at add-press time) sort ascending by that add-order, after every occurrence with no such entry (loaded saved data), which keeps its grouped position. `globalIndex` is the loop index over `renderedChoiceOccurrences`, so it reflects the displayed sequence, not always the grouped one. |
| `DynamicFormTemplate` | The rendering bridge for user templates. Dispatches to named slots with priority fallback (per-type slot → `default-input`/`default-array`/`default-array-item`/`default-choice`/`default-choice-array`/`default-choice-array-item` → `default`; the `-choice-array` families are checked before the plain `-array` families because their type strings also end in `-array`/`-array-item`). Slot props typed via `defineMetadata`. The `-choice`/`default-choice` (single, `maxOccurs: 1`) and `-choice-array`/`default-choice-array` (repeatable, `maxOccurs > 1`) slots both receive `ChoiceAttributes` (extends `ArrayChoiceAttributes` with `addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences: ChoiceOccurrence[]`, `usedChoiceOccurrences: number`). The `*-choice-array-item`/`default-choice-array-item` slots (one per rendered occurrence of a `maxOccurs > 1` explicit choice) receive `ChoiceArrayItemAttributes` (extends `ItemAttributes` with `branchKey: string`, `globalIndex: number`, the occurrence's zero-based position across every branch's rendered occurrences (renumbers live on add/removal, never stored), and `insertionOrder?: number`, its ephemeral add-order position this session, `undefined` for an occurrence loaded rather than added; also carries `removeItem`), mirroring `*-array-item`. |

## Composables & core (exported)

| Export | Role |
| --- | --- |
| `defineMetadata` | Pure type-level configuration carrier (`<FieldValueTypes, ExtendedFieldProperties, SlotProperties, ExtendedSettingsProperties>`); runtime values are empty stubs. |
| `useDynamicForm` | Wraps vee-validate's `useForm()`; adds `useFieldValue(path)` (typed path accessor) and `validateSection(sectionPath)` (wizard-step validation). |
| `useValidatePartialForm` | Partial-form validation. Quirk: when called in the same component as `useDynamicForm` it reads the form context from the instance's own `provides` instead of `inject`. |

## Types (exported)

`DynamicFormItemProps`, `DynamicFormSettings`, `FieldMetadata`, `GetDynamicFormSettingsType`, `GetMetadataType`, `MetadataConfiguration`, `RequireOnly`, `ValidationMessage`.

`FieldMetadata` gained `explicitChoiceSelection?: boolean` (additive, default off; see `DynamicFormItemChoice` above). It is excluded from `ComputedPropsFieldType`: `computedProps` cannot change it at runtime, so a choice's render mode can never flip mid-form.

`FieldMetadata` also gained `preserveOnSwitch?: boolean` (additive, default off; ST-05), a per-choice flag sitting next to `explicitChoiceSelection` that opts a `maxOccurs: 1` explicit choice into preserve-on-switch (see `DynamicFormItemChoice` above). Like `explicitChoiceSelection`, it is excluded from `ComputedPropsFieldType` so `computedProps` cannot flip stash/restore behaviour mid-form.

`ChoiceOccurrence` (`{ branchKey: string, index: number }`), `ChoiceAttributes`, and `ChoiceArrayItemAttributes` are declared in `DynamicFormTemplate.vue` next to `ArrayChoiceAttributes`/`ItemAttributes` and surface through the `-choice`/`-choice-array`/`-choice-array-item` slot typing; not (yet) re-exported from `index.ts`.

`FieldMetadata` also gained `maxOccursTotal?: number` (additive, default off), meaningful on a `choice` branch: an opt-in, non-XSD hard cap on that branch's total raw occurrence count across the whole choice, independent of the XSD batching `maxOccurs` drives (no `<xs:choice>` equivalent). Applies in both explicit mode (`canAddChoiceOccurrence` disables the branch's add once reached) and auto mode (clamps the branch's rendered array headroom). Excluded from `ComputedPropsFieldType` alongside `maxOccurs`, for the same static-metadata-only reason: occurrence capacity must not flip mid-form via `computedProps`.

`FieldMetadata` also gained `displayOrder?: 'grouped' | 'added'` (additive, default `'grouped'`), meaningful on a `maxOccurs > 1` explicit choice: selects whether `DynamicFormItemChoice` renders occurrences grouped (today's behaviour) or in this session's add-order (see `DynamicFormItemChoice` above). Static metadata only, excluded from `ComputedPropsFieldType` alongside `explicitChoiceSelection`/`preserveOnSwitch`, for the same reason: flipping the render order mid-form via `computedProps` would make an already-rendered occurrence visibly jump position.

`DynamicFormItemProps` gained `branchKey?: string`: set on the `DynamicFormItem` rendering a single occurrence of a repeatable explicit choice branch, it drives the `-choice-array-item` slot type suffix (mirroring `partOfArrayField`'s `-array-item` suffix) and is forwarded to the slot as `branchKey`.

`DynamicFormItemProps` also gained `globalIndex?: number` (additive, engine-internal wiring, mirroring `branchKey`): set alongside `branchKey` on a repeatable explicit choice occurrence's `DynamicFormItem`, it is the render-loop index over `renderedChoiceOccurrences` and is forwarded to the slot as `globalIndex`. `undefined` everywhere else (plain array items, non-explicit choices, `maxOccurs: 1` explicit choices, and any other field).

`DynamicFormItemProps` also gained `insertionOrder?: number` (additive, engine-internal wiring, mirroring `globalIndex`): set alongside `globalIndex` on a repeatable explicit choice occurrence's `DynamicFormItem`, it is that occurrence's ephemeral add-order position this session (1-based, in add-press order across every branch), `undefined` for an occurrence that existed before this session or was never added via `addChoiceOccurrence`. Forwarded to the slot as `insertionOrder`; never written to form `values`.

## Utils (exported)

`checkTreeHasValue`, `mapEachMetadataItem`, `removeNullValues`, `setInPath`.

Internal-only utils (not exported, free to change): `camelize`, `createValidation`, `getFieldLabel`, `hashField`, `isNullOrUndefined`, `normalizePath`, `overridePath`, `resolveMessage`, `splitValidationFunctions`.

## Validation rules (globally registered, `packages/core/src/core/validation.ts`)

`xsd_required`, `xsd_minOccurs`, `xsd_choiceMinOccurs`, `xsd_minLength`, `xsd_maxLength`, `xsd_length`, `xsd_pattern`, `xsd_minInclusive`, `xsd_maxInclusive`, `xsd_minExclusive`, `xsd_maxExclusive`, `xsd_enumeration`, `xsd_whiteSpace`, `xsd_fractionDigits`, `xsd_totalDigits`.

Message resolution priority: `settings.messages` → vee-validate `generateMessage` → rule default. Positional (`{0}`) and named (`{min}`, `{field}`) placeholders supported.

## Non-published surfaces

| Surface | Where | Notes |
| --- | --- | --- |
| `ElementPlusDynamicForm` | `packages/element-plus/` (private package) | Element Plus template implementation. |
| Example template | `packages/core/src/examples/` (`TestForm`, `TestFormTemplate`, `IconButton`) | Reference template used by tests and Storybook. |
| Storybook playground | `playgrounds/storybook/` | Template development playground, not published. |
| Docs site | `docs/` | VitePress, published to vue-dynamic-form.bach.software. |
