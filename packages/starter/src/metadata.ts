import type { WizardGotoStepOptions } from '@bach.software/vue-dynamic-form';
import type { StarterIconName } from '@/icons';
import type { Props as ReviewGroupProps } from '@/ReviewGroup.vue';
import { defineMetadata } from '@bach.software/vue-dynamic-form';

export interface StarterValueTypes {
  wizardSummaryPage: never
  heading: never
  text: string
  select: string
  checkbox: boolean | undefined
  password: string
}

export interface StarterFieldProperties {
  description?: string
  helpText?: string
  arrayItemName?: string
  arrayItemNamePlural?: string
  arrayItemFieldForTitle?: string
  arrayNoItemsMessage?: string
  /** Empty-state title of a repeatable section. Defaults to "No {arrayItemNamePlural} added yet". */
  arrayNoItemsTitle?: string
  /** Label of the add buttons of a repeatable field. Defaults to "Add {arrayItemName}" or "Add another". */
  arrayAddButtonText?: string
  /** Label of the empty-state add button of a repeatable section. Defaults to "Add a {arrayItemName}". */
  arrayAddFirstButtonText?: string
  /** Placeholder title of a repeater card without a title value. Defaults to "New {arrayItemName}". */
  arrayNewItemTitle?: string
  /** Label of the remove buttons of a repeatable field. Defaults to "Remove". */
  arrayRemoveButtonText?: string
  /** Aria label of a repeater card's remove button; `{number}` is the item number. Defaults to "Remove item {number}". */
  arrayRemoveAriaLabel?: string
  choiceShowChoiceSelect?: boolean
  /** Label of a choice branch's add button; `{option}` is the branch title. Defaults to "Add {option}". */
  choiceAddButtonText?: string
  /** Helper text next to a disabled choice add button; `{option}` is the branch title. Defaults to "The limit for {option} has been reached.". */
  choiceLimitReachedText?: string
  /** Aria label of the choice radiogroup when the field has no label. Defaults to "Choose an option". */
  choiceAriaLabel?: string
  iconName?: StarterIconName
  dependentOnMessage?: string
  placeholder?: string
  options?: { key: string, value: string }[]
  fullWidth?: boolean
  disabled?: boolean
  hide?: boolean
  showStrengthBar?: boolean
  /** Labels of the password strength bar tiers. Default to "Weak", "Fair", "Good" and "Strong". */
  passwordStrengthLabels?: { weak?: string, fair?: string, good?: string, strong?: string }
  /** Aria label of the password visibility toggle while the password is hidden. Defaults to "Show password". */
  showPasswordAriaLabel?: string
  /** Aria label of the password visibility toggle while the password is visible. Defaults to "Hide password". */
  hidePasswordAriaLabel?: string
  falseAsUndefined?: boolean
  /** One card per review group, rendered through the standalone `ReviewGroup` component. */
  wizardSummary?: ReviewGroupProps[]
  wizardSummaryConfirmation?: string
  /** Heading above `wizardSummaryConfirmation`. Defaults to "Ready to submit?". */
  wizardSummaryConfirmationTitle?: string
  submitButtonText?: string
  /** Label of the wizard's next button. Defaults to "Continue". */
  nextButtonText?: string
  /** Label of the wizard's back button. Defaults to "Back". */
  prevButtonText?: string
  /** Wizard progress line; `{current}` and `{total}` are the step numbers. Defaults to "Step {current} of {total}". */
  stepText?: string
  /** Aria label of the wizard's step navigation. Defaults to "Progress". */
  stepperAriaLabel?: string
  /** Aria label of a single step button; `{number}` and `{title}` are the step number and title. Defaults to "Step {number}: {title}". */
  stepAriaLabel?: string
}

export interface StarterSlotProperties {
  /** Provided by the wizard page slot, forwarded to a page's own slot content (e.g. the summary page's edit links). */
  gotoStep?: (index: number, options?: WizardGotoStepOptions) => Promise<void> | void
}

export interface StarterSettingsProperties {
  showRequiredOrOptional?: 'optional' | 'required'
  /** Tag text next to a non-required field label when `showRequiredOrOptional` is `'optional'`. Defaults to "Optional". */
  optionalText?: string
}

/** The built-in starter field types and their extended properties. */
export const starterMetadata = defineMetadata<StarterValueTypes, StarterFieldProperties, StarterSlotProperties, StarterSettingsProperties>();

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
