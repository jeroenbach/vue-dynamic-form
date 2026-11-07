# Choice Fields

Mutually exclusive branches: the user fills in one of several alternatives, and the other branches are disabled and skip validation until they become active.

## What It Demonstrates

- `choice` array on a heading to declare mutually exclusive branches
- Automatic mode: the branch the user starts filling in wins, siblings disable
- Explicit mode (`explicitChoiceSelection`): pick a branch first, then fill in its fields
- Repeatable choices and branches, add-order display, and per-kind caps

## Example

<FormExampleChoiceFields />

## How It Works

Declare the branches in a `choice` array (it replaces `children` on the heading). Each entry becomes a branch with its own fields:

<<< @/.vitepress/theme/components/FormExampleChoiceFields.vue#choice-structure{ts} [FormExampleChoiceFields.vue]

- As soon as one branch has a value, the sibling branches are disabled.
- Only the active branch's fields are validated; the others are relaxed until they become active.
- Clearing the active branch re-enables the others.

This is the automatic mode: whichever branch the user starts typing into is the one that counts. The rest of this page covers the opt-in explicit mode, where the user picks a branch before any fields appear.

## Select First, Then Fill In

Some forms should ask "what kind of data do you want to enter?" before showing any fields. Set `explicitChoiceSelection: true` on the choice field to get that flow: nothing renders until the user picks a branch.

<FormExampleChoiceExplicitSingle />

<<< @/.vitepress/theme/components/FormExampleChoiceExplicitSingle.vue#metadata{ts} [FormExampleChoiceExplicitSingle.vue]

With the flag on, no branch renders until your template calls `addChoiceOccurrence`. The library ships no picker widget: cards, a `<select>`, or per-branch buttons are all template code built on the picker slot props (`addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences`, `usedChoiceOccurrences`), documented in [Choice-Only Props](/reference/dynamic-form-template#choice-only-props). A minimal picker in a template looks like this:

```vue-html
<DynamicFormTemplate>
  <template #default-choice="{ fieldMetadata, addChoiceOccurrence, activeChoiceOccurrences }">
    <fieldset>
      <legend>{{ fieldMetadata.fieldOptions?.label }}</legend>

      <!-- Nothing selected yet: show the picker. -->
      <div v-if="!activeChoiceOccurrences.length">
        <button
          v-for="branch in fieldMetadata.choice"
          :key="branch.name"
          type="button"
          @click="addChoiceOccurrence(branch.name)"
        >
          {{ branch.fieldOptions?.label }}
        </button>
      </div>

      <!-- A branch is active: its fields render as the slot's default content. -->
      <slot v-else />
    </fieldset>
  </template>
</DynamicFormTemplate>
```

The starter template's picker cards read each branch's `description` for the card text; set `choicePicker.description` on a branch to pitch the option on the card in different words, as the example above does. See [`choicePicker`](/reference/starter-field-properties#choicepicker).

Switching to a different branch clears the previous branch's data; the exact contract (and the `removeNullValues` cleanup helper) is described under [`explicitChoiceSelection`](/reference/field-metadata#explicitchoiceselection).

### Keeping Values Across Switches (`preserveOnSwitch`)

If users may switch back and forth, add `preserveOnSwitch: true` next to `explicitChoiceSelection: true`. Try it below: fill in a branch, switch away, then switch back. The branch's data comes back without flashing errors on still-empty required fields.

<FormExampleChoicePreserveOnSwitch />

<<< @/.vitepress/theme/components/FormExampleChoicePreserveOnSwitch.vue#metadata{ts} [FormExampleChoicePreserveOnSwitch.vue]

The copy lives in memory only, never in the form values; see [`preserveOnSwitch`](/reference/field-metadata#preserveonswitch) for the details.

## A Repeatable Branch Inside a Single Choice

A branch can itself repeat: a `maxOccurs: 1` choice may contain a branch with `maxOccurs: 3`. Picking that branch is still exclusive (the other branches stay locked out), but within it you can add up to 3 items:

<FormExampleChoiceRepeatableBranch />

<<< @/.vitepress/theme/components/FormExampleChoiceRepeatableBranch.vue#metadata{ts} [FormExampleChoiceRepeatableBranch.vue]

All items of the selected branch together count as **one** choice occurrence, so the sibling lock-out behaves exactly as with a single-value branch, and switching to the other branch clears all items at once.

## A Repeatable Choice (`maxOccurs > 1`)

When the choice itself has `maxOccurs > 1`, selecting a branch adds one occurrence instead of activating it exclusively. The user can add several of the same kind, or mix kinds, up to the choice's shared budget:

<FormExampleChoiceExplicitRepeatable />

<<< @/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue#metadata{ts} [FormExampleChoiceExplicitRepeatable.vue]

A repeatable choice renders through the `-choice-array` slot family, and each active occurrence renders through `-choice-array-item`, which adds `branchKey`, `removeItem()`, and a gap-free `globalIndex` for a continuous "1, 2, 3" badge:

```vue-html
<DynamicFormTemplate>
  <template #default-choice-array="{ fieldMetadata, addChoiceOccurrence, canAddChoiceOccurrence, usedChoiceOccurrences }">
    <fieldset>
      <legend>{{ fieldMetadata.fieldOptions?.label }} ({{ usedChoiceOccurrences }} of {{ fieldMetadata.maxOccurs }})</legend>

      <button
        v-for="branch in fieldMetadata.choice"
        :key="branch.name"
        type="button"
        :disabled="!canAddChoiceOccurrence(branch.name)"
        @click="addChoiceOccurrence(branch.name)"
      >
        Add {{ branch.fieldOptions?.label }}
      </button>

      <!-- Every active occurrence renders here, via default-choice-array-item below. -->
      <slot />
    </fieldset>
  </template>

  <template #default-choice-array-item="{ branchKey, globalIndex, removeItem }">
    <div>
      <span>{{ globalIndex + 1 }}. {{ branchKey }}</span>
      <slot />
      <button type="button" @click="removeItem">Remove</button>
    </div>
  </template>
</DynamicFormTemplate>
```

A branch's own `maxOccurs` follows XSD batch-size semantics here (it is not a per-kind ceiling); see [`maxOccurs`](/reference/field-metadata#maxoccurs). The [Run of Show Builder](/examples/run-of-show) carries this mechanism through a whole page.

### Showing Occurrences in the Order They Were Added

By default, occurrences render grouped by branch declaration order: first all "CRM export" items, then all "API endpoint" items. Two opt-in flags change that; the toolbar in the example above flips both live, so you can try each combination:

| Flag                    | What it does                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `displayOrder: 'added'` | Renders occurrences in the order they were added, interleaving kinds. Display only, nothing is written to `values`.                                                               |
| `preserveOrder: true`   | Additionally writes an `order` number (`1, 2, 3...` in add order) into each occurrence's values, so the order is real submitted data that survives a reload or loaded saved data. |

The exact semantics (reactivity, normalization of loaded data, and the requirements on branches) are documented under [`displayOrder`](/reference/field-metadata#displayorder) and [`preserveOrder`](/reference/field-metadata#preserveorder).

### Capping a Branch's Total Count (`maxOccursTotal`)

To enforce "at most 3 of this kind", set `maxOccursTotal` on the branch. The example above uses this: each kind is capped at 3, while the choice allows 5 in total, so an Add button disables at whichever limit hits first:

```ts
const crmExportBranch = {
  name: 'crmExport',
  maxOccurs: 1,
  maxOccursTotal: 3,
  fieldOptions: { label: 'CRM export' },
};
```

See [`maxOccursTotal`](/reference/field-metadata#maxoccurstotal) for the full contract and its `vdf_maxOccursTotal` validation backstop.

## Full Metadata

<<< @/.vitepress/theme/components/FormExampleChoiceFields.vue#metadata{ts} [FormExampleChoiceFields.vue]

## Related Source

- [FormExampleChoiceFields.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceFields.vue)
- [FormExampleChoiceExplicitSingle.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceExplicitSingle.vue)
- [FormExampleChoicePreserveOnSwitch.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoicePreserveOnSwitch.vue)
- [FormExampleChoiceRepeatableBranch.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceRepeatableBranch.vue)
- [FormExampleChoiceExplicitRepeatable.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue)
- [StarterFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/packages/starter/src/StarterFormTemplate.vue)
- [ChoiceSectionCard.vue](https://github.com/jeroenbach/dynamic-form/blob/main/packages/starter/src/ChoiceSectionCard.vue)
- [ChoiceArraySectionCard.vue](https://github.com/jeroenbach/dynamic-form/blob/main/packages/starter/src/ChoiceArraySectionCard.vue)
