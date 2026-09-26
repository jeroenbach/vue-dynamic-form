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

## Explicit Selection: Pick First, Then Fill In

Some forms should ask "what kind of data do you want to enter?" before showing any fields. Set `explicitChoiceSelection: true` on the choice field to get that flow: nothing renders until the user picks a branch.

<FormExampleChoiceExplicitSingle />

<<< @/.vitepress/theme/components/FormExampleChoiceExplicitSingle.vue#metadata{ts} [FormExampleChoiceExplicitSingle.vue]

With the flag on, no branch renders until your template calls `addChoiceOccurrence`. The choice's slot receives a small set of props for building the picker:

| Slot prop | Purpose |
| --- | --- |
| `addChoiceOccurrence(branchKey)` | Selects a branch (`maxOccurs: 1`) or adds one occurrence of it (`maxOccurs > 1`). |
| `removeChoiceOccurrence(branchKey, index?)` | Deselects the active branch; pass `index` when the choice repeats. |
| `canAddChoiceOccurrence(branchKey)` | `false` when the choice is full or the branch reached its own cap. |
| `activeChoiceOccurrences` | Array of `{ branchKey, index }` for everything currently selected. |
| `usedChoiceOccurrences` | How many of the choice's `maxOccurs` slots are in use. |

`branchKey` is always the branch's `name`, never its position.

The library ships no picker widget: cards, a `<select>`, or per-branch buttons are all template code built on these props (the cards above come from the docs template's own `ChoiceSectionCard`). A minimal picker in a template looks like this:

```vue
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
```

Picking a branch satisfies the choice's `xsd_choiceMinOccurs` rule immediately; the required fields inside the branch still enforce their own values separately.

**Switching branches clears the old branch.** Selecting a different branch sets the previous branch's data to `undefined`. Those `undefined` placeholders can linger in the raw `values` object, but they are harmless: validation and occurrence counting ignore them, and they disappear under `JSON.stringify`. If you need a fully clean object at submit time, run the exported `removeNullValues(values)` once, as the [Client Onboarding Wizard](/examples/advanced) does.

### Keeping Values Across Switches (`preserveOnSwitch`)

If users may switch back and forth, add `preserveOnSwitch: true` next to `explicitChoiceSelection: true`. Try it below: fill in a branch, switch away, then switch back.

<FormExampleChoicePreserveOnSwitch />

<<< @/.vitepress/theme/components/FormExampleChoicePreserveOnSwitch.vue#metadata{ts} [FormExampleChoicePreserveOnSwitch.vue]

Switching away still clears the branch from the form values (submit only ever sees the active branch), but the engine keeps an in-memory copy and restores it when the user switches back, without flashing errors on still-empty required fields. The copy is never written to `values` and does not survive a page reload. The flag only applies to `maxOccurs: 1` explicit choices.

## A Repeatable Branch Inside a Single Choice

A branch can itself repeat: a `maxOccurs: 1` choice may contain a branch with `maxOccurs: 3`. Picking that branch is still exclusive (the other branches stay locked out), but within it you can add up to 3 items:

<FormExampleChoiceRepeatableBranch />

<<< @/.vitepress/theme/components/FormExampleChoiceRepeatableBranch.vue#metadata{ts} [FormExampleChoiceRepeatableBranch.vue]

All items of the selected branch together count as **one** choice occurrence, so the sibling lock-out and `xsd_choiceMinOccurs` behave exactly as with a single-value branch, and switching to the other branch clears all items at once. Because the choice itself does not repeat, it renders through the regular `-choice` slot and the branch renders through the normal `-array` / `-array-item` slots.

## A Repeatable Choice (`maxOccurs > 1`)

When the choice itself has `maxOccurs > 1`, selecting a branch adds one occurrence instead of activating it exclusively. The user can add several of the same kind, or mix kinds, up to the choice's shared budget:

<FormExampleChoiceExplicitRepeatable />

<<< @/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue#metadata{ts} [FormExampleChoiceExplicitRepeatable.vue]

A repeatable choice renders through the `-choice-array` slot family (falling back to the `-choice` slots when none is defined), and each active occurrence renders through `-choice-array-item`. On top of the picker props above, the item slot receives:

- `branchKey`: which kind this occurrence is
- `removeItem()`: removes this occurrence
- `index`: the occurrence's position within its own branch (resets per kind)
- `globalIndex`: the occurrence's position across all branches combined, for a continuous "1, 2, 3" badge; it renumbers automatically on removal, so it never leaves a gap

```vue
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
```

By default, occurrences render grouped by branch declaration order, not by the order the add buttons were clicked: first all "CRM export" items, then all "API endpoint" items. The next section shows how to opt into click order instead.

::: details XSD occurrence math: a branch's `maxOccurs` is a batch size
Following XSD semantics, a branch's `maxOccurs` is not an independent total; it is the batch size that branch consumes one choice slot with. A choice with `maxOccurs: 5` containing a branch with `maxOccurs: 2` allows up to 10 items of that branch, with every 2 items consuming 1 of the 5 shared slots. `xsd_choiceMinOccurs` counts in these slot units too, not in raw items.
:::

### Showing Occurrences in the Order They Were Added

Two opt-in flags, set next to `explicitChoiceSelection`, control the ordering. Both are reactive: change them in your metadata at any time and the choice adjusts in place, no remount needed. The toolbar in the example above flips both live, so you can try each combination:

| Flag | What it does |
| --- | --- |
| `displayOrder: 'added'` | Renders occurrences in the order they were added, interleaving kinds. Display only, nothing is written to `values`. The default, `'grouped'`, groups by kind. |
| `preserveOrder: true` | Additionally writes an `order` number (`1, 2, 3...` in add order) into each occurrence's values, so the order is real submitted data that survives a reload or loaded saved data. |

With `displayOrder: 'added'` alone, the add order lives only in memory: the engine records every add press regardless of the current display mode (so flipping to `'added'` mid-session shows the clicks made before the flip too), but a page reload starts over and the display falls back to grouped order. Turn on `preserveOrder` to make it durable.

`preserveOrder` keeps the `order` values contiguous at all times: occurrences loaded without `order` (or with gaps from older data) are normalized to `1..N` at mount, preserving their relative order, and removing an occurrence renumbers the survivors. Flipping it on mid-session seeds `order` into the occurrences that already exist; flipping it off strips `order` from all of them (loading a form with the flag simply absent never touches existing data).

`preserveOrder` needs an object to write into, so it requires every branch to have `children`: if any branch is a bare scalar, the flag is disabled for the whole choice (with a development-mode warning naming the branch), and `displayOrder: 'added'` keeps working through the in-memory tier for all kinds. Avoid declaring your own child field named `order` on branches that use it; the ordering owns that key and warns about the collision in development.

One visible side effect of `preserveOrder`: a freshly added occurrence already holds a value (its `order`), so its required fields show their required indicator immediately instead of after the first touch. Validation outcomes are identical either way; only the indicator timing shifts.

### Capping a Branch's Total Count (`maxOccursTotal`)

As the XSD math above shows, a branch's `maxOccurs` is a batch size, not a ceiling. To enforce "at most 3 of this kind" set `maxOccursTotal` on the branch, a non-XSD opt-in that caps the branch's raw item count across the whole choice:

```ts
{
  name: 'crmExport',
  maxOccurs: 1,
  maxOccursTotal: 3,
  fieldOptions: { label: 'CRM export' },
}
```

`canAddChoiceOccurrence` turns `false` for that branch once the cap is reached, regardless of how much of the choice's shared budget remains. The example above uses this: each kind is capped at 3, while the choice allows 5 in total, so an Add button disables at whichever limit hits first. The property works the same way in automatic mode.

## Full Metadata

<<< @/.vitepress/theme/components/FormExampleChoiceFields.vue#metadata{ts} [FormExampleChoiceFields.vue]

## Related Source

- [FormExampleChoiceFields.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceFields.vue)
- [FormExampleChoiceExplicitSingle.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceExplicitSingle.vue)
- [FormExampleChoicePreserveOnSwitch.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoicePreserveOnSwitch.vue)
- [FormExampleChoiceRepeatableBranch.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceRepeatableBranch.vue)
- [FormExampleChoiceExplicitRepeatable.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
- [ChoiceSectionCard.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/ChoiceSectionCard.vue)
- [ChoiceArraySectionCard.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/ChoiceArraySectionCard.vue)
