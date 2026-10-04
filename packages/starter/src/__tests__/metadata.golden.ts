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
  choiceShowChoiceSelect?: boolean
  iconName?: string
  dependentOnMessage?: string
  placeholder?: string
  options?: { key: string, value: string }[]
  fullWidth?: boolean
  disabled?: boolean
  hide?: boolean
  showStrengthBar?: boolean
  falseAsUndefined?: boolean
  wizardSummary?: { title: string, rows: [label: string, value: string][], dataTestid?: string }[]
  wizardSummaryConfirmation?: string
  submitButtonText?: string
}

/** Independently written slot properties of the built-in catalogue. */
export interface GoldenSlotProperties {
  gotoStep?: (index: number, options?: WizardGotoStepOptions) => Promise<void> | void
}

/** Independently written settings properties of the built-in catalogue. */
export interface GoldenSettingsProperties {
  showRequiredOrOptional?: 'optional' | 'required'
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
