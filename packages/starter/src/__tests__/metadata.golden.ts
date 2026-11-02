import type { WizardGotoStepOptions } from '@bach.software/vue-dynamic-form';

/** Independently written value types of the built-in catalogue. Drift in the source types must fail a test. */
export interface GoldenValueTypes {
  wizardSummaryPage: never
  heading: never
  grid: never
  text: string
  select: string
  checkbox: boolean | undefined
  password: string
}

/** Independently written mirror of the responsive-value shape. */
type GoldenResponsive<T> = T | { base?: T, md?: T, lg?: T };

/** Independently written extended field properties of the built-in catalogue. */
export interface GoldenFieldProperties {
  description?: string
  helpText?: string
  dependentOnMessage?: string
  placeholder?: string
  suffix?: string
  options?: { key: string, value: string }[]
  iconName?: string
  columns?: GoldenResponsive<1 | 2 | 3 | 4 | 5 | 6>
  colSpan?: GoldenResponsive<1 | 2 | 3 | 4 | 5 | 6 | 'full'>
  colStart?: GoldenResponsive<1 | 2 | 3 | 4 | 5 | 6>
  disabled?: boolean
  hide?: boolean
  array?: {
    itemName?: string
    itemNamePlural?: string
    itemFieldForTitle?: string
    noItemsMessage?: string
    noItemsTitle?: string
    addButtonText?: string
    addFirstButtonText?: string
    newItemTitle?: string
    removeButtonText?: string
    removeAriaLabel?: string
  }
  choicePicker?: {
    show?: boolean
    addButtonText?: string
    limitReachedText?: string
    ariaLabel?: string
  }
  password?: {
    showStrengthBar?: boolean
    strengthLabels?: { weak?: string, fair?: string, good?: string, strong?: string }
    showAriaLabel?: string
    hideAriaLabel?: string
  }
  checkbox?: {
    falseAsUndefined?: boolean
  }
  wizardSummary?: {
    groups?: { title: string, rows: [label: string, value: string][], editButtonText?: string, dataTestid?: string }[]
    confirmation?: string
    confirmationTitle?: string
  }
  wizardTexts?: {
    submitButtonText?: string
    nextButtonText?: string
    prevButtonText?: string
    stepText?: string
    stepperAriaLabel?: string
    stepAriaLabel?: string
    stepErrorsText?: string
  }
}

/** Independently written slot properties of the built-in catalogue. */
export interface GoldenSlotProperties {
  gotoStep?: (index: number, options?: WizardGotoStepOptions) => Promise<void> | void
}

/** Independently written settings properties of the built-in catalogue. */
export interface GoldenSettingsProperties {
  showRequiredOrOptional?: 'optional' | 'required'
  optionalText?: string
  showValidState?: boolean
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
