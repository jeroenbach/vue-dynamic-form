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
  choiceShowChoiceSelect?: boolean
  iconName?: StarterIconName
  dependentOnMessage?: string
  placeholder?: string
  options?: { key: string, value: string }[]
  fullWidth?: boolean
  disabled?: boolean
  hide?: boolean
  showStrengthBar?: boolean
  falseAsUndefined?: boolean
  /** One card per review group, rendered through the standalone `ReviewGroup` component. */
  wizardSummary?: ReviewGroupProps[]
  wizardSummaryConfirmation?: string
  submitButtonText?: string
}

export interface StarterSlotProperties {
  /** Provided by the wizard page slot, forwarded to a page's own slot content (e.g. the summary page's edit links). */
  gotoStep?: (index: number, options?: WizardGotoStepOptions) => Promise<void> | void
}

export interface StarterSettingsProperties {
  showRequiredOrOptional?: 'optional' | 'required'
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
