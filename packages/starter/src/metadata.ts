import type { GetDynamicFormSettingsType, GetMetadataType, WizardGotoStepOptions } from '@bach.software/vue-dynamic-form';
import type { StarterIconName } from '@/icons';
import type { Props as ReviewGroupProps } from '@/ReviewGroup.vue';
import { defineMetadata } from '@bach.software/vue-dynamic-form';

export interface StarterValueTypes {
  'wizardSummaryPage': never
  'heading': never
  /** A bare layout container: renders its children in a plain CSS-grid div, no card chrome. */
  'grid': never
  'text': string
  'select': string
  'checkbox': boolean | undefined
  'password': string
  'textarea': string
  /** Flat, mutually exclusive option list rendered as radio buttons; reuses the root `options` property `select` also reads. */
  'radio': string
  /** Native number input. The model stays a string, never a coerced JS number; see `number`'s group property for its native min/max/step hints. */
  'number': string
  'email': string
  'tel': string
  'url': string
  'date': string
  'time': string
  'datetime-local': string
  /** Single-file upload; `undefined` when no file is held. */
  'file': File | undefined
}

/**
 * A plain value, or one value per breakpoint tier. Tiers are mobile-first: a tier applies at
 * its width and up until a larger tier overrides it (`base` from 0, `md` from 768px, `lg` from
 * 1024px). The widths are fixed in the stylesheet; the "Breakpoint widths" section of the
 * theming docs shows the CSS override that changes them.
 */
export type Responsive<T> = T | { base?: T, md?: T, lg?: T };

/** Column count of a children grid; also the unit of `colSpan` and `colStart`. */
export type GridColumnCount = 1 | 2 | 3 | 4 | 5 | 6;

export interface StarterFieldProperties {
  description?: string
  helpText?: string
  dependentOnMessage?: string
  placeholder?: string
  /** Short unit label shown right after the input, e.g. "min". */
  suffix?: string
  options?: { key: string, value: string }[]
  iconName?: StarterIconName
  /**
   * Number of equal columns of this field's children grid: a `type: 'grid'` field, or any
   * built-in chrome that lays its children out in a grid (section cards, groups, choice
   * bodies). A bare value applies from the 768px tier up; below it the grid stays one column.
   */
  columns?: Responsive<GridColumnCount>
  /** Number of parent-grid columns this field spans, or `'full'` for the whole row. A bare value applies from the 768px tier up. */
  colSpan?: Responsive<GridColumnCount | 'full'>
  /** Parent-grid column line this field starts on, e.g. to leave the rest of a row empty. A bare value applies from the 768px tier up. */
  colStart?: Responsive<GridColumnCount>
  disabled?: boolean
  hide?: boolean

  /**
   * Chrome and texts of a repeatable field or section. The item texts (`newItemTitle`,
   * `removeButtonText`, `removeAriaLabel`) are also read by repeatable-choice items.
   */
  array?: {
    itemName?: string
    itemNamePlural?: string
    /** Name of the child field whose value titles each repeater card. */
    itemFieldForTitle?: string
    noItemsMessage?: string
    /** Empty-state title of a repeatable section. Defaults to "No {itemNamePlural} added yet". */
    noItemsTitle?: string
    /** Label of the add buttons of a repeatable field. Defaults to "Add {itemName}" or "Add another". */
    addButtonText?: string
    /** Label of the empty-state add button of a repeatable section. Defaults to "Add a {itemName}". */
    addFirstButtonText?: string
    /** Placeholder title of a repeater card without a title value. Defaults to "New {itemName}". */
    newItemTitle?: string
    /** Label of the remove buttons of a repeatable field. Defaults to "Remove". */
    removeButtonText?: string
    /** Aria label of a repeater card's remove button; `{number}` is the item number. Defaults to "Remove item {number}". */
    removeAriaLabel?: string
  }

  /**
   * The branch picker of an explicit choice (the click-to-select cards, or the per-branch add
   * bar of a repeatable choice). Named `choicePicker` because the core engine already owns the
   * `choice` property (the branches themselves).
   *
   * `show`, `addButtonText`, `limitReachedText`, and `ariaLabel` configure the picker as a whole
   * and belong on the parent choice field. `description` is different: it is set on a branch
   * itself (like the item texts under `array`), and overrides that one branch's card text,
   * falling back to the branch's own `description` when unset. Use it when the picker card
   * should pitch the option in different words than the fuller explanation shown in the branch
   * body once it's selected, e.g. a short pitch on the card ("Fastest to launch") versus a
   * longer explanation once picked.
   */
  choicePicker?: {
    /** Renders the picker; without it an explicit choice shows no selection UI of its own. */
    show?: boolean
    /** Label of a branch's add button; `{option}` is the branch title. Defaults to "Add {option}". */
    addButtonText?: string
    /** Helper text next to a disabled add button; `{option}` is the branch title. Defaults to "The limit for {option} has been reached.". */
    limitReachedText?: string
    /** Aria label of the radiogroup when the field has no label. Defaults to "Choose an option". */
    ariaLabel?: string
    /** Set on a branch to override its own picker-card description; falls back to the branch's `description`. */
    description?: string
  }

  /** Extras of a `password` field. */
  password?: {
    showStrengthBar?: boolean
    /** Labels of the strength bar tiers. Default to "Weak", "Fair", "Good" and "Strong". */
    strengthLabels?: { weak?: string, fair?: string, good?: string, strong?: string }
    /** Aria label of the visibility toggle while the password is hidden. Defaults to "Show password". */
    showAriaLabel?: string
    /** Aria label of the visibility toggle while the password is visible. Defaults to "Hide password". */
    hideAriaLabel?: string
  }

  /** Extras of a `checkbox` field. */
  checkbox?: {
    /** Store `undefined` instead of `false` when the toggle is off. */
    falseAsUndefined?: boolean
  }

  /**
   * Native spinner/stepping hints of a `number` field, forwarded as plain `min`/`max`/`step`
   * attributes. These are affordance only: they do not enforce anything on submit, so pair
   * them with a matching `restriction` (`minInclusive`/`maxInclusive`) for real validation.
   */
  number?: {
    min?: number
    max?: number
    step?: number
  }

  /** Extras of a `file` field. */
  file?: {
    /** Native accept filter forwarded to the input, e.g. ".pdf,.doc,.docx". */
    accept?: string
    /** Aria label of the clear button; `{name}` is the chosen filename. Defaults to "Remove {name}". */
    clearAriaLabel?: string
  }

  /** The review page of a wizard (a `wizardSummaryPage` field). */
  wizardSummary?: {
    /** One card per review group, rendered through the standalone `ReviewGroup` component. */
    groups?: ReviewGroupProps[]
    confirmation?: string
    /** Heading above `confirmation`. Defaults to "Ready to submit?". */
    confirmationTitle?: string
  }

  /**
   * Texts of the wizard chrome, set on the wizard field itself. Named `wizardTexts` because
   * the core engine already owns the `wizard` property (the wizard marker and config).
   */
  wizardTexts?: {
    submitButtonText?: string
    /** Label of the next button. Defaults to "Continue". */
    nextButtonText?: string
    /** Label of the back button. Defaults to "Back". */
    prevButtonText?: string
    /** Progress line; `{current}` and `{total}` are the step numbers. Defaults to "Step {current} of {total}". */
    stepText?: string
    /** Aria label of the step navigation. Defaults to "Progress". */
    stepperAriaLabel?: string
    /** Aria label of a single step button; `{number}` and `{title}` are the step number and title. Defaults to "Step {number}: {title}". */
    stepAriaLabel?: string
    /** Message shown above the footer on the last step when any step has errors. Defaults to "Some steps still contain errors. Fix the steps marked in red before submitting.". */
    stepErrorsText?: string
  }
}

export interface StarterSlotProperties {
  /** Provided by the wizard page slot, forwarded to a page's own slot content (e.g. the summary page's edit links). */
  gotoStep?: (index: number, options?: WizardGotoStepOptions) => Promise<void> | void
}

export interface StarterSettingsProperties {
  showRequiredOrOptional?: 'optional' | 'required'
  /** Tag text next to a non-required field label when `showRequiredOrOptional` is `'optional'`. Defaults to "Optional". */
  optionalText?: string
  /** Marks a touched, valid input with a success border and a `data-field-state` attribute. */
  showValidState?: boolean
}

/** The built-in starter field types and their extended properties. */
export const starterMetadata = defineMetadata<StarterValueTypes, StarterFieldProperties, StarterSlotProperties, StarterSettingsProperties>();

/** A field in a metadata tree built on the starter catalogue; type your `metadata` arrays with `StarterMetadata[]`. */
export type StarterMetadata = GetMetadataType<typeof starterMetadata>;

/** The `DynamicForm` settings shape when using the starter template, including the starter's own settings. */
export type StarterDynamicFormSettings = GetDynamicFormSettingsType<typeof starterMetadata>;

/**
 * Layers your own field types, field properties, slot properties, and settings on top of
 * `starterMetadata`. On a key collision your declaration replaces the built-in one.
 *
 * Purely a type carrier: nothing is merged at runtime.
 */
export function extendMetadata<
  const ExtraValueTypes extends Record<string, any> = object,
  ExtraFieldProperties extends object = object,
  ExtraSlotProperties extends object = object,
  ExtraSettingsProperties extends object = object,
>() {
  return defineMetadata<
    Omit<StarterValueTypes, keyof ExtraValueTypes> & ExtraValueTypes,
    Omit<StarterFieldProperties, keyof ExtraFieldProperties> & ExtraFieldProperties,
    Omit<StarterSlotProperties, keyof ExtraSlotProperties> & ExtraSlotProperties,
    Omit<StarterSettingsProperties, keyof ExtraSettingsProperties> & ExtraSettingsProperties
  >();
}
