import type { WizardGotoStepOptions } from '@bach.software/vue-dynamic-form';

/** Independently written value types of the built-in catalogue. Drift in the source types must fail a test. */
export interface GoldenValueTypes {
  wizardSummaryPage: never
  heading: never
  text: string
  select: string
  checkbox: boolean | undefined
  password: string
}

/** Independently written extended field properties of the built-in catalogue. */
export interface GoldenFieldProperties {
  description?: string
  helpText?: string
  arrayItemName?: string
  arrayItemNamePlural?: string
  arrayItemFieldForTitle?: string
  arrayNoItemsMessage?: string
  arrayNoItemsTitle?: string
  arrayAddButtonText?: string
  arrayAddFirstButtonText?: string
  arrayNewItemTitle?: string
  arrayRemoveButtonText?: string
  arrayRemoveAriaLabel?: string
  choiceShowChoiceSelect?: boolean
  choiceAddButtonText?: string
  choiceLimitReachedText?: string
  choiceAriaLabel?: string
  iconName?: string
  dependentOnMessage?: string
  placeholder?: string
  options?: { key: string, value: string }[]
  fullWidth?: boolean
  disabled?: boolean
  hide?: boolean
  showStrengthBar?: boolean
  passwordStrengthLabels?: { weak?: string, fair?: string, good?: string, strong?: string }
  showPasswordAriaLabel?: string
  hidePasswordAriaLabel?: string
  falseAsUndefined?: boolean
  wizardSummary?: { title: string, rows: [label: string, value: string][], editButtonText?: string, dataTestid?: string }[]
  wizardSummaryConfirmation?: string
  wizardSummaryConfirmationTitle?: string
  submitButtonText?: string
  nextButtonText?: string
  prevButtonText?: string
  stepText?: string
  stepperAriaLabel?: string
  stepAriaLabel?: string
}

/** Independently written slot properties of the built-in catalogue. */
export interface GoldenSlotProperties {
  gotoStep?: (index: number, options?: WizardGotoStepOptions) => Promise<void> | void
}

/** Independently written settings properties of the built-in catalogue. */
export interface GoldenSettingsProperties {
  showRequiredOrOptional?: 'optional' | 'required'
  optionalText?: string
}

type IsEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

/**
 * Per key of `Golden`, whether `Actual` has that key with exactly the same type.
 * Comparing with `AllTrue<Golden>` fails for a missing, renamed, or retyped key.
 */
export type KeyByKeyEquality<Actual, Golden, Skip extends PropertyKey = never> = {
  [K in Exclude<keyof Golden, Skip>]: K extends keyof Actual ? IsEqual<Actual[K], Golden[K]> : false
};

export type AllTrue<Golden, Skip extends PropertyKey = never> = {
  [K in Exclude<keyof Golden, Skip>]: true
};
