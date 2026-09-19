# Choice Fields

Mutually exclusive branches. Selecting one branch disables the others and relaxes their child field validation until that branch becomes active.

## What It Demonstrates

- `choice` array on a heading to declare mutually exclusive branches
- Branch children are only validated once the branch is active
- Sibling branches are automatically disabled when one branch has a value
- Each branch can have its own `children` with independent fields

## Example

<FormExampleChoiceFields />

## Choice Structure

The `choice` property replaces `children` on the heading. Each entry becomes a selectable branch:

<<< @/.vitepress/theme/components/FormExampleChoiceFields.vue#choice-structure{ts} [FormExampleChoiceFields.vue]

## Select first, then fill in

Everything above is the automatic mode: whichever branch the user starts typing into is the one that counts, and siblings disable themselves once that happens. Some forms need the opposite flow: show a selector first ("what kind of data do you want to enter?") and only reveal that branch's fields once the user has explicitly picked one, before anything has been filled in.

Set `explicitChoiceSelection: true` on the `choice` field to opt into this mode. With the flag absent (or `false`), nothing here changes: the page above still applies exactly as written. With the flag on, no branch renders until your template calls `addChoiceOccurrence`, and the choice's slot receives four extra primitives to drive the interaction. A `maxOccurs: 1` choice renders through the `-choice` slot family; a repeatable (`maxOccurs > 1`) choice renders through `-choice-array`. Both receive the same four primitives:

| Slot prop | Signature | Purpose |
| --- | --- | --- |
| `addChoiceOccurrence` | `(branchKey: string) => void` | Marks a branch active (`maxOccurs: 1`) or adds one occurrence of it (`maxOccurs > 1`). No-op when `canAddChoiceOccurrence(branchKey)` is `false`. |
| `removeChoiceOccurrence` | `(branchKey: string, index?: number) => void` | Removes a previously added occurrence. `index` is required for `maxOccurs > 1`; omit it for `maxOccurs: 1`, where it deselects the currently active branch. |
| `canAddChoiceOccurrence` | `(branchKey: string) => boolean` | Per-branch guard, `false` once that branch's own `maxOccurs`, or the choice's shared occurrence budget, is exhausted. |
| `activeChoiceOccurrences` | `{ branchKey: string; index: number }[]` | The occurrences currently active. Use it to render a count, drive per-branch button state, or check whether anything is selected yet. |

`branchKey` is always the branch's `name`, never its position, so your template code reads against metadata names rather than array indices.

The engine ships no widget for this: cards, a `<select>`, per-branch "Add" buttons, are all template-author code built on these four primitives. `ChoiceSectionCard.vue` in this library's own docs (used by the [Client Onboarding Wizard example](/examples/advanced)) is one card-based worked example for the single case, and `ChoiceArraySectionCard.vue` its per-branch-Add-buttons counterpart for the repeatable case; a `<select>` that calls `addChoiceOccurrence` on change works exactly the same way underneath.

### Pick exactly one (`maxOccurs: 1`)

The metadata is unchanged apart from the new flag:

```ts
const metadata = [
  {
    name: 'contactMethod',
    fieldOptions: { label: 'Preferred contact' },
    explicitChoiceSelection: true,
    choice: [
      { name: 'email', type: 'text', fieldOptions: { label: 'Email address' } },
      { name: 'phone', type: 'text', fieldOptions: { label: 'Phone number' } },
    ],
  },
];
```

The `-choice` slot (here using the `default-choice` fallback) shows a picker while nothing is selected, and renders the active branch's fields (the slot's own default content, forwarded automatically by the engine) once one is:

```vue
<template #default-choice="{ fieldMetadata, addChoiceOccurrence, activeChoiceOccurrences, fieldContext: { errorMessage } }">
  <fieldset>
    <legend>{{ fieldMetadata.fieldOptions?.label }}</legend>
    <p v-if="errorMessage.value">{{ errorMessage.value }}</p>

    <!-- Nothing selected yet: show the picker, no branch fields rendered at all. -->
    <div v-if="!activeChoiceOccurrences.length" role="radiogroup" :aria-label="fieldMetadata.fieldOptions?.label">
      <button
        v-for="branch in fieldMetadata.choice"
        :key="branch.name"
        type="button"
        @click="addChoiceOccurrence(branch.name)"
      >
        {{ branch.fieldOptions?.label }}
      </button>
    </div>

    <!-- A branch is active: its fields render here, passed through as this slot's default content. -->
    <slot v-else />
  </fieldset>
</template>
```

Picking a branch satisfies `xsd_choiceMinOccurs` immediately, before any field inside it has a value; the branch's own required fields then enforce their own content separately, exactly as they would in automatic mode.

Here is that flow running. It is built with the docs' own `AdvancedFormTemplate`, whose `ChoiceSectionCard` implements the picker as selectable cards on top of the same four primitives (`type: 'heading'` and `choiceShowChoiceSelect: true` belong to that template's contract, not to the engine):

<FormExampleChoiceExplicitSingle />

<<< @/.vitepress/theme/components/FormExampleChoiceExplicitSingle.vue#metadata{ts} [FormExampleChoiceExplicitSingle.vue]

**Switching branches (clear-on-switch).** Calling `addChoiceOccurrence` for a different branch than the one currently active clears the previously active branch's data: the engine sets it to `undefined` through vee-validate's form context. That branch's key can remain present in the raw `values` object with an `undefined`-valued shape (for example `contactMethod: { email: undefined }`) rather than being deleted outright; this residue is behaviourally inert, occurrence counting and `xsd_choiceMinOccurs` both ignore `undefined` values, and it serialises away under `JSON.stringify`. If you need a byte-clean object at submit time, run the exported `removeNullValues(values)` once, the same way the [Client Onboarding Wizard example](/examples/advanced)'s `handleSubmit` does for its `launchApproach` choice.

**Keeping values across switches (`preserveOnSwitch`).** Set `preserveOnSwitch: true` next to `explicitChoiceSelection: true` to soften clear-on-switch: switching away still clears the branch from the form `values` (submit only ever sees the active branch), but the engine first stashes a copy of what was filled in, and switching back restores it. The stash is ephemeral and instance-local, never written to `values`, and restored fields come back pristine: no error flashes on a still-empty required field. The flag only applies to `maxOccurs: 1` explicit choices:

<FormExampleChoicePreserveOnSwitch />

<<< @/.vitepress/theme/components/FormExampleChoicePreserveOnSwitch.vue#metadata{ts} [FormExampleChoicePreserveOnSwitch.vue]

See the [Client Onboarding Wizard example](/examples/advanced) (the `launchApproach` step) for this pattern inside a full wizard, including the submit-time `removeNullValues` cleanup. The `maxOccurs > 1` flow has its own live example below.

### A repeatable branch inside a single choice

The choice's `maxOccurs` and a branch's own `maxOccurs` are independent limits that multiply, following XSD semantics: a branch's limit applies per occurrence of the choice. So a `maxOccurs: 1` choice can still contain a branch with `maxOccurs: 3`; picking that branch is exclusive (the other branches stay locked out), but within it you can add up to 3 items:

<FormExampleChoiceRepeatableBranch />

<<< @/.vitepress/theme/components/FormExampleChoiceRepeatableBranch.vue#metadata{ts} [FormExampleChoiceRepeatableBranch.vue]

All items of the selected branch together count as **one** choice occurrence, so `xsd_choiceMinOccurs` and the sibling lock-out behave exactly as with a single-value branch, and switching to the other branch clears all of them at once. Because the choice itself is still `maxOccurs: 1`, it renders through the regular `-choice` slot, and the repeatable branch renders through the normal `-array` / `-array-item` slots with its own add and remove buttons; the `-choice-array` and `-choice-array-item` slot families below only come into play when the choice itself repeats.

### Add several, each one of several kinds (`maxOccurs > 1`)

When the choice itself has `maxOccurs > 1`, selecting a branch adds one occurrence of it instead of activating it exclusively; you can add more than one occurrence of the same branch, or mix branches, up to each branch's own `maxOccurs` and the choice's shared occurrence budget:

```ts
const metadata = [
  {
    name: 'integrations',
    fieldOptions: { label: 'Integrations to add' },
    maxOccurs: 5,
    explicitChoiceSelection: true,
    choice: [
      { name: 'crmExport', type: 'text', fieldOptions: { label: 'CRM export' } },
      { name: 'apiEndpoint', type: 'text', fieldOptions: { label: 'API endpoint' } },
    ],
  },
];
```

A repeatable choice renders through the `-choice-array` slot (here using its `default-choice-array` fallback), which renders the per-branch "Add" buttons and a count; each active occurrence's own fields render automatically through the `-choice-array-item` slot (here using its `default-choice-array-item` fallback), which also receives `branchKey` and a `removeItem` wired to `removeChoiceOccurrence`:

```vue
<template #default-choice-array="{ fieldMetadata, addChoiceOccurrence, canAddChoiceOccurrence, activeChoiceOccurrences, fieldContext: { errorMessage } }">
  <fieldset>
    <legend>{{ fieldMetadata.fieldOptions?.label }} ({{ activeChoiceOccurrences.length }} of {{ fieldMetadata.maxOccurs }})</legend>
    <p v-if="errorMessage.value">{{ errorMessage.value }}</p>

    <button
      v-for="branch in fieldMetadata.choice"
      :key="branch.name"
      type="button"
      :disabled="!canAddChoiceOccurrence(branch.name)"
      @click="addChoiceOccurrence(branch.name)"
    >
      Add {{ branch.fieldOptions?.label }}
    </button>

    <!-- Every active occurrence's fields render here, one after another, via default-choice-array-item below. -->
    <slot />
  </fieldset>
</template>

<template #default-choice-array-item="{ branchKey, removeItem }">
  <div>
    <span class="kind-badge">{{ branchKey }}</span>
    <slot />
    <button type="button" @click="removeItem">
      Remove
    </button>
  </div>
</template>
```

`activeChoiceOccurrences` is grouped by branch declaration order, then by index within the branch, derived purely from the value tree; it is never global insertion order. Adding a "CRM export", then an "API endpoint", then a second "CRM export" always yields `[{ branchKey: 'crmExport', index: 0 }, { branchKey: 'crmExport', index: 1 }, { branchKey: 'apiEndpoint', index: 0 }]`, in that order, regardless of the order the add buttons were clicked. Treat the list as either order-agnostic or reflecting that grouped order; do not build UI that assumes it mirrors click order.

Adding an occurrence satisfies `xsd_choiceMinOccurs` immediately, the same way selecting a branch does for `maxOccurs: 1`: the act of adding is what counts, and the occurrence's own required fields enforce their own content separately.

And here is the repeatable flow running. The docs template renders the per-branch Add buttons through `ChoiceArraySectionCard` (its `-choice-array` counterpart to `ChoiceSectionCard`) and wraps each active occurrence in a removable card via its `default-choice-array-item` slot. Each branch here has `maxOccurs: 3` while the choice's shared budget is 5, so an Add button disables at 3 of that kind or 5 in total, whichever comes first:

<FormExampleChoiceExplicitRepeatable />

<<< @/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue#metadata{ts} [FormExampleChoiceExplicitRepeatable.vue]

## Full Metadata

<<< @/.vitepress/theme/components/FormExampleChoiceFields.vue#metadata{ts} [FormExampleChoiceFields.vue]

## Related Source

- [FormExampleChoiceFields.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceFields.vue)
- [FormExampleChoiceExplicitSingle.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceExplicitSingle.vue)
- [FormExampleChoiceRepeatableBranch.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceRepeatableBranch.vue)
- [FormExampleChoiceExplicitRepeatable.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
- [ChoiceSectionCard.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/ChoiceSectionCard.vue)
- [ChoiceArraySectionCard.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/ChoiceArraySectionCard.vue)
