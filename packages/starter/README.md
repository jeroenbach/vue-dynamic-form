# @bach.software/vue-dynamic-form-starter

A portable, Tailwind-free default form template for [`@bach.software/vue-dynamic-form`](https://github.com/jeroenbach/vue-dynamic-form). Hand it to `DynamicForm` and every field, group, array, choice, wizard, and review step in your metadata renders with a complete, good-looking skin, with no CSS framework to install and no template to write yourself.

This is an installable dependency, not a cloneable scaffold. "Starter" describes the result it gives you (a complete starting look for your form), not a project generator: you `pnpm add` it like any other package and keep it as a dependency. There is no CLI, no copied source, nothing to detach from.

It is a drop-in counterpart of the core `DynamicFormTemplate`: the same slot names, the same priority fallback, and every slot overridable with the starter markup as its default content.

## Install

```sh
pnpm add @bach.software/vue-dynamic-form-starter @bach.software/vue-dynamic-form vee-validate vue
```

No `element-plus` and no Tailwind. Icons come from [Lucide](https://lucide.dev) (`@lucide/vue`), bundled into this package so it works out of the box; a consumer never installs it directly.

## Stylesheet

Import the one shipped stylesheet once, for example in your app entry or next to the form:

```ts
import '@bach.software/vue-dynamic-form-starter/style.css';
```

It is plain CSS: semantic `sft-` prefixed class names, no Tailwind or other build-time framework required. Dark mode follows the same `.dark` class VitePress toggles on `<html>`; nothing extra to wire up.

## Bare usage

Pass the template to `DynamicForm`. No wrapper is needed, and this gives you the full starter rendering for every field type and every structural shape, including wizards:

```vue
<script lang="ts" setup>
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import '@bach.software/vue-dynamic-form-starter/style.css';

const metadata = [
  { name: 'firstName', fieldOptions: { label: 'First name' }, placeholder: 'Enter your first name' },
  { name: 'plan', type: 'select', fieldOptions: { label: 'Plan' }, options: [{ key: 'starter', value: 'Starter' }, { key: 'pro', value: 'Pro' }] },
  { name: 'newsletter', type: 'checkbox', fieldOptions: { label: 'Subscribe to the newsletter' }, minOccurs: 0 },
];

const { handleSubmit } = useDynamicForm();
const onSubmit = handleSubmit(values => console.log(values));
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <DynamicForm :metadata="metadata" :template="StarterFormTemplate" />
    <button type="submit">
      Submit
    </button>
  </form>
</template>
```

## Overriding a control

Overriding needs a thin wrapper component, because Vue slots are the only way to hand your markup to the `:template`. The wrapper always forwards the `input` slot, which hands the engine's render to the built-in chrome. Then add a slot for each thing you want to change:

```vue
<script lang="ts" setup>
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
</script>

<template>
  <StarterFormTemplate>
    <!-- Hands the engine's field render to the built-in chrome. -->
    <template #input="s">
      <slot v-bind="s" />
    </template>

    <!-- Overrides the built-in text control with your own. -->
    <template #default-input="{ fieldContext, fieldMetadata, disabled }">
      <input
        :value="fieldContext.value.value"
        :placeholder="fieldMetadata.placeholder"
        :disabled="disabled || fieldMetadata.disabled"
        @input="fieldContext.handleChange(($event.target as HTMLInputElement).value)"
      >
    </template>
  </StarterFormTemplate>
</template>
```

Use the wrapper as the template: `<DynamicForm :metadata="metadata" :template="MyFormTemplate" />`.

`input` is the one reserved slot name: it carries the engine's render, which is why the wrapper forwards it, and it is not an override point itself.

### Supported slots

| Family                 | Slots                                                                                                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structural             | `default`, `default-input`, `default-array`, `heading-array`, `heading-array-item`, `default-choice`, `heading-choice`, `heading-choice-array`, `default-choice-array-item`, `default-wizard`, `default-wizard-page`, `wizardSummaryPage` |
| Field wrapper          | `heading`, `checkbox`                                                                                                                                                                                                                     |
| Input, one per control | `select-input`, `checkbox-input`, `password-input`, `textarea-input`, `radio-input`, `file-input`                                                                                                                                         |

Slots are chosen with the priority fallback of the core `DynamicFormTemplate`: the dedicated per-type slot first, then the matching `default-*` slot, then `default`. Overriding `default-input` replaces every plain text-like control at once. Overriding a slot replaces only that slot; everything else keeps its default rendering.

A consumer overriding `default-wizard-page` must keep the `v-show` gate on `isCurrent` and never switch to `v-if`, which would drop the page's fields from validation when the user navigates away.

Any other slot you supply, for example one for a field type you added, is passed on to the dispatcher unchanged.

## Icons

Icons render through [Lucide](https://lucide.dev) by default: a bounded, tree-shaken registry of names (`chevronLeft`, `chevronRight`, `check`, `trash`, `plus`, `zap`, `users`, `grid`, `pencil`, `checkCircle`, `loader`, `refreshCw`, `eye`, `eyeOff`, plus a sample set for choice-card decoration such as `building2`, `rocket`, `calendar`, `briefcase`, `shield`, `sparkles`). Pre-select one for a choice option with the `iconName` field property, typed as `StarterIconName`.

To replace every glyph with your own icon component, supply the `#icon` scoped slot on a wrapper around `StarterFormTemplate`. Its slot props are exactly `{ name, size, strokeWidth }`:

```vue
<script lang="ts" setup>
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import { MyIcon } from './MyIcon.vue';
</script>

<template>
  <StarterFormTemplate>
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #icon="{ name, size, strokeWidth }">
      <MyIcon :name="name" :size="size" :stroke-width="strokeWidth" />
    </template>
  </StarterFormTemplate>
</template>
```

**`#icon` is only reachable through this wrapper pattern, never by passing it directly to `DynamicForm`.** `DynamicForm` forwards only the engine's own render to the template; it never forwards a consumer's own slots. Writing `<DynamicForm :template="StarterFormTemplate"><template #icon="...">` does nothing, because no `StarterFormTemplate` instance in the tree ever sees that slot. Wrap the template as shown above and pass the wrapper as `:template` instead.

`ReviewGroup` and `SubmissionSuccess`, when used standalone with no `StarterFormTemplate` ancestor, always render the Lucide default: there is no template above them to provide an override.

## Accessibility

Every control this template renders meets WCAG 2.2 AA for keyboard and screen-reader use, by default, with no setting to turn it off: label/description/error association on every control, error and password-strength announcements, full keyboard operability (including the password reveal toggle and an ARIA APG roving-tabindex pattern on choice cards), and automatic focus management on wizard navigation and validation failure. For a non-wizard form, call the exported `focusFirstInvalid(containerEl)` helper from your own `onInvalidSubmit` so a failed submit still takes the user to the first invalid field. See the [full guide section](https://vue-dynamic-form.bach.software/guide/starter-template#accessibility) for details and a wiring example.

## Customization guidance

- **Retheme with CSS variables.** Colour, corner radius, and typography are all `--sft-*` custom properties declared on `:root` (and re-declared under `:root.dark` where the dark skin genuinely differs). Override the variables in your own CSS to retheme the whole template without touching a single `sft-` rule.
- **Override by cascade.** Classes are single, low-specificity selectors with no `!important`. Import the stylesheet, then add your own rule with equal or higher specificity; no utility-class fight.
- **Override one control at a time.** Use the wrapper pattern above for a single field type, a single section, or the icon rendering, and let everything else keep its default look.
- **Add your own field types and properties.** `extendMetadata` layers your own field types and extended properties on top of the built-in catalogue, purely at the type level.

### The `--sft-*` theming contract

Every custom property the stylesheet declares on `:root` is listed below, with its purpose and default value. This is the complete, authoritative surface: nothing else is themeable, and nothing here is removed or renamed without a major version bump.

| Variable                     | Purpose                                                                                                             | Default                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `--sft-accent`               | Primary accent colour (switch-on track, active step dot, primary button background)                                 | `#0084d1`                                                           |
| `--sft-accent-hover`         | Primary button hover background                                                                                     | `#0069a8`                                                           |
| `--sft-card-bg`              | Card and panel background (section cards, repeater, choice cards, default buttons, icon-catalogue tiles)            | `#ffffff`                                                           |
| `--sft-card-border`          | Card and panel border (section cards, group divider, switch field, repeater, choice cards, review rows, icon tiles) | `#e2e8f0`                                                           |
| `--sft-card-shadow`          | Default card drop shadow (section cards, selected choice card)                                                      | `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)` |
| `--sft-choice`               | Selected-choice accent (border, radio dot border, radio dot fill)                                                   | `#4f39f6`                                                           |
| `--sft-choice-border-hover`  | Choice card hover border                                                                                            | `#a3b3ff`                                                           |
| `--sft-choice-grad-bottom`   | Bottom stop of the selected choice card's background gradient                                                       | `#ffffff`                                                           |
| `--sft-choice-grad-top`      | Top stop of the selected choice card's background gradient                                                          | `#eef2ff`                                                           |
| `--sft-choice-ring`          | Choice card focus ring                                                                                              | `#a3b3ff`                                                           |
| `--sft-confirm-bg`           | Wizard confirmation banner background                                                                               | `#ecfdf5`                                                           |
| `--sft-confirm-border`       | Wizard confirmation banner border                                                                                   | `#a4f4cf`                                                           |
| `--sft-confirm-text`         | Wizard confirmation banner text                                                                                     | `#004f3b`                                                           |
| `--sft-danger-border`        | Invalid-state border (input, switch field, error step dot background)                                               | `#fb2c36`                                                           |
| `--sft-danger-focus-border`  | Invalid input's focus border                                                                                        | `#fb2c36`                                                           |
| `--sft-danger-ring`          | Invalid-state focus ring (input, error step dot ring)                                                               | `#ffc9c9`                                                           |
| `--sft-danger-soft-bg`       | Soft danger banner background (wizard step-errors alert)                                                            | `#fef2f2`                                                           |
| `--sft-danger-soft-border`   | Soft danger banner border                                                                                           | `#ffc9c9`                                                           |
| `--sft-danger-soft-hover-bg` | Soft danger button hover background                                                                                 | `#ffe2e2`                                                           |
| `--sft-danger-soft-text`     | Soft danger banner text                                                                                             | `#c10007`                                                           |
| `--sft-danger-text`          | Error message text                                                                                                  | `#e7000b`                                                           |
| `--sft-focus-border`         | Default input focus border                                                                                          | `#00a6f4`                                                           |
| `--sft-focus-ring`           | Default input focus ring                                                                                            | `#b8e6fe`                                                           |
| `--sft-focus-visible`        | Keyboard `:focus-visible` ring (inputs, selects, every button, the toggle switch, the stepper, the wizard page)     | `#0084d1`                                                           |
| `--sft-focus-visible-choice` | Keyboard `:focus-visible` ring for choice cards only, kept separate from the primary accent family                  | `#4f39f6`                                                           |
| `--sft-font-mono`            | Monospace font stack for code snippets (submission reference, icon-catalogue names)                                 | `ui-monospace, SFMono-Regular, Menlo, monospace`                    |
| `--sft-font-size-2xl`        | Wizard page title size                                                                                              | `24px`                                                              |
| `--sft-font-size-lg`         | Section title size                                                                                                  | `18px`                                                              |
| `--sft-font-size-md`         | Default body and control text size                                                                                  | `14px`                                                              |
| `--sft-font-size-sm`         | Small text size (pills, tags, captions, helper and hint text)                                                       | `12px`                                                              |
| `--sft-font-size-xl`         | Success screen title size                                                                                           | `20px`                                                              |
| `--sft-font-size-xs`         | Icon-catalogue caption size                                                                                         | `11px`                                                              |
| `--sft-font-weight-medium`   | Medium text weight (switch field label, strength label, buttons, confirm emphasis)                                  | `500`                                                               |
| `--sft-font-weight-semibold` | Semibold text weight (headings, titles, pills, badges)                                                              | `600`                                                               |
| `--sft-heading`              | Heading text colour (section title, wizard title, success title)                                                    | `#0f172b`                                                           |
| `--sft-input-bg`             | Text/select input background                                                                                        | `#ffffff`                                                           |
| `--sft-input-border`         | Text/select input resting border                                                                                    | `#e5e7eb`                                                           |
| `--sft-input-disabled-bg`    | Disabled input background                                                                                           | `#f8fafc`                                                           |
| `--sft-input-disabled-text`  | Disabled input text                                                                                                 | `#62748e`                                                           |
| `--sft-muted-bg`             | Muted panel background (dependent placeholder, switch field, empty state, choice group, review header, timeline)    | `#f8fafc`                                                           |
| `--sft-muted-border`         | Dashed muted panel border (dependent placeholder, empty state, choice group)                                        | `#cad5e2`                                                           |
| `--sft-pill-bg`              | Pill/badge background                                                                                               | `#eef2ff`                                                           |
| `--sft-pill-text`            | Pill/badge text, choice-card icon colour                                                                            | `#432dd7`                                                           |
| `--sft-placeholder`          | Input placeholder text                                                                                              | `#90a1b9`                                                           |
| `--sft-radius-lg`            | Corner radius: icon-catalogue demo tile                                                                             | `10px`                                                              |
| `--sft-radius-md`            | Corner radius: input, textarea, radio option, dependent placeholder, choice group, wizard alert, JSON panel         | `8px`                                                               |
| `--sft-radius-pill`          | Corner radius: fully rounded (pills, badges, radio dots, switch track/thumb, step dots)                             | `9999px`                                                            |
| `--sft-radius-sm`            | Corner radius: buttons, the file field's clear button                                                               | `6px`                                                               |
| `--sft-radius-xl`            | Corner radius: section, switch field, repeater, empty state, choice card, review group, confirm banner, timeline    | `12px`                                                              |
| `--sft-radius-xs`            | Corner radius: the wizard page container's programmatic focus outline                                               | `4px`                                                               |
| `--sft-success`              | Valid-state border (opt-in via `showValidState`)                                                                    | `#00bc7d`                                                           |
| `--sft-success-badge-bg`     | Submission success badge background                                                                                 | `#d0fae5`                                                           |
| `--sft-success-badge-text`   | Submission success badge icon colour                                                                                | `#009966`                                                           |
| `--sft-text`                 | Primary body text colour                                                                                            | `#0f172b`                                                           |
| `--sft-text-muted`           | Muted secondary text colour                                                                                         | `#45556c`                                                           |
| `--sft-text-strong`          | Emphasized text colour (labels, titles, review values)                                                              | `#1d293d`                                                           |
| `--sft-text-subtle`          | Subtle tertiary text colour (descriptions, hints, captions)                                                         | `#62748e`                                                           |
| `--sft-track`                | Password-strength meter track background                                                                            | `#e2e8f0`                                                           |

A few of these (`--sft-radius-md`, `--sft-radius-xl`, `--sft-radius-pill`) are reused across several unrelated pieces of chrome that happen to share the same shape today; overriding one of them changes all of its listed call sites together, not just one.

**Semver rule for this contract:** adding a new `--sft-*` variable is a minor change. Renaming or removing one is a major change. A consumer who only reads variables already in this table is never broken by a minor release.

## Adding a field type or a property

```vue
<script lang="ts" setup>
import { extendMetadata, StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';

// One extra field type on top of the built-in catalogue, with its own `rows` property.
const extendedMetadata = extendMetadata<{ richText: string }, { rows?: number }>();
</script>

<template>
  <StarterFormTemplate :metadataConfiguration="extendedMetadata">
    <template #input="s">
      <slot v-bind="s" />
    </template>

    <!-- Renders the extended field type. -->
    <template #richText-input="{ fieldContext, fieldMetadata, disabled }">
      <textarea
        :rows="fieldMetadata.rows ?? 4"
        :value="fieldContext.value.value"
        :placeholder="fieldMetadata.placeholder"
        :disabled="disabled || fieldMetadata.disabled"
        @input="fieldContext.handleChange(($event.target as HTMLTextAreaElement).value)"
      />
    </template>
  </StarterFormTemplate>
</template>
```

Then use `{ name: 'notes', type: 'richText', rows: 6 }` in your metadata. The generics are `extendMetadata<ValueTypes, FieldProperties, SlotProperties, SettingsProperties>()`; all four are optional. Type the metadata array with `GetMetadataType<typeof extendedMetadata>` if you want your own types checked.

Caveats:

- **Your declaration wins on a collision.** Redeclaring a built-in type (for example `text`) or a built-in property (for example `description`) replaces it instead of merging with it. Supply the matching slot as well, because the built-in fallback markup still assumes the built-in property shape and is not type-checked against your replacement.
- **`input` is reserved.** A field type named `input` is not supported, because the name collides with the reserved slot above.

## Exports

| Export                                                                                    | Kind                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `StarterFormTemplate`                                                                     | component                                                                 |
| `starterMetadata`                                                                         | the built-in catalogue, the default `metadataConfiguration`               |
| `extendMetadata`                                                                          | function (type carrier)                                                   |
| `StarterValueTypes`, `StarterFieldProperties`                                             | types of the built-in catalogue                                           |
| `StarterMetadata`, `StarterDynamicFormSettings`                                           | ready-made field and settings types for the built-in catalogue            |
| `StarterIcon`                                                                             | component, the Lucide-backed icon primitive                               |
| `StarterIconName`, `starterIconNames`                                                     | the registry's name union and ordered list                                |
| `SubmissionSuccess`                                                                       | component, a standalone post-submit screen (with its `TimelineItem` type) |
| `ReviewGroup`                                                                             | component, a standalone wizard-review card (with its props type)          |
| `AppButton`                                                                               | component, a standalone button (with its `AppButtonProps` type)           |
| `ChoiceArraySectionCard`                                                                  | component, a standalone repeatable choice section card                    |
| `ChoiceOption`                                                                            | type, the option shape `ChoiceSectionCard`/`ChoiceArraySectionCard` take  |
| `FieldMetadata`, `GetMetadataType`, `GetDynamicFormSettingsType`, `MetadataConfiguration` | types re-exported from the core package                                   |
| `@bach.software/vue-dynamic-form-starter/style.css`                                       | the stylesheet                                                            |
