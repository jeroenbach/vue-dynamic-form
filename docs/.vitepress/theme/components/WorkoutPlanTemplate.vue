<script lang="ts" setup>
import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';
import { defineMetadata, DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { toValue } from 'vue';
import ChoiceArraySectionCard from './ChoiceArraySectionCard.vue';
import FormField from './FormField.vue';
import SelectInput from './SelectInput.vue';
import TextInput from './TextInput.vue';
import WorkoutBlockRow from './WorkoutBlockRow.vue';

// #region template-metadata-contract
export type Metadata = GetMetadataType<typeof metadata>;

export type DynamicFormSettings = GetDynamicFormSettingsType<typeof metadata>;

const metadata = defineMetadata<
  {
    /** The plan choice and every block branch: a container with no value of its own. */
    block: never
    text: string
    select: string
    number: number | undefined
  },
  {
    description?: string
    placeholder?: string
    options?: { key: string, value: string }[]
    fullWidth?: boolean
    hide?: boolean
    disabled?: boolean
    /** A short unit label shown right after a number input, e.g. "min". */
    suffix?: string
  },
  object,
  object
>();
// #endregion template-metadata-contract

/**
 * A field is pristine until it has been touched once; after that it is either invalid (an
 * error message is showing) or valid. Mirrors the checkout template's own helper so both
 * examples read the same border/state convention.
 */
function inputFieldState(meta: { valid: boolean, touched: boolean }, hasError: boolean): 'pristine' | 'invalid' | 'valid' {
  if (hasError)
    return 'invalid';
  if (meta.touched && meta.valid)
    return 'valid';
  return 'pristine';
}
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <template #block-choice-array="{ fieldMetadata, fieldContext: { errorMessage, label }, addChoiceOccurrence, canAddChoiceOccurrence, usedChoiceOccurrences, activeChoiceOccurrences }">
      <ChoiceArraySectionCard
        class="md:col-span-2"
        :label
        :description="fieldMetadata.description"
        :error-message="errorMessage.value"
        :dataTestid="fieldMetadata.path"
        :options="fieldMetadata.choice.map(x => ({ value: x.name, title: toValue(x.fieldOptions?.label) }))"
        :addChoiceOccurrence
        :canAddChoiceOccurrence
        :usedChoiceOccurrences
        :maxOccurs="fieldMetadata.maxOccurs"
      >
        <!-- The mandatory empty state: minOccurs: 0 makes a zero-block plan valid data, so this
        panel is a normal, non-error state, not a validation failure. -->
        <div
          v-if="!activeChoiceOccurrences.length"
          class="md:col-span-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-sm text-slate-500 dark:text-slate-400"
          :data-testid="`${fieldMetadata.path}-empty`"
        >
          No blocks yet. Add a block above to start building your plan.
        </div>
        <div v-else class="md:col-span-2 flex flex-col gap-4">
          <slot />
        </div>
      </ChoiceArraySectionCard>
    </template>

    <!-- #region block-row-slot -->
    <template #block-choice-array-item="{ fieldMetadata, branchKey, index, canRemoveItems, removeItem, globalIndex }">
      <WorkoutBlockRow
        :path="fieldMetadata.path ?? ''"
        :planPath="fieldMetadata.parent?.path ?? ''"
        :branches="(fieldMetadata.parent?.choice ?? []).map(x => ({ name: x.name ?? '' }))"
        :branchKey
        :index
        :globalIndex
        :canRemove="canRemoveItems"
        @remove="removeItem"
      >
        <slot />
      </WorkoutBlockRow>
    </template>
    <!-- #endregion block-row-slot -->

    <!-- Every leaf field (text/select/number) reaches here; a block never carries children of its own type, it only ever groups branch fields, which route through WorkoutBlockRow's nested slot instead. -->
    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, settings: { showRequiredOrOptional } }">
      <FormField
        v-show="!fieldMetadata.hide"
        :class="{ 'sm:col-span-2': fieldMetadata.fullWidth }"
        :disabled="fieldMetadata.disabled || disabled"
        :input-id="fieldMetadata.path"
        :dataTestid="fieldMetadata.path"
        :description="fieldMetadata.description"
        :label
        :required
        :show-required-or-optional
        :errorMessage="errorMessage.value"
      >
        <slot />
      </FormField>
    </template>

    <!-- Number inputs pass the raw string value to handleChange instead of the native event,
    so vee-validate keeps the leaf a string in the form model (it special-cases number inputs
    and would otherwise store a real JS number). -->
    <template #default-input="{ fieldMetadata, fieldContext: { value, meta, handleBlur, handleChange, errorMessage }, disabled }">
      <div v-if="fieldMetadata.suffix" class="flex items-center gap-2">
        <TextInput
          :id="fieldMetadata.path"
          :dataTestid="`${fieldMetadata.path}-input`"
          :type="fieldMetadata.type"
          :value="value.value"
          :disabled="fieldMetadata.disabled || disabled"
          :errorMessage="errorMessage.value"
          :placeholder="fieldMetadata.placeholder"
          :data-field-state="inputFieldState(meta, !!errorMessage.value)"
          class="flex-1"
          :class="{ '!border-[color:var(--vp-c-success-3)]': inputFieldState(meta, !!errorMessage.value) === 'valid' }"
          @input="handleChange(($event.target as HTMLInputElement).value)"
          @blur="handleBlur"
        />
        <span class="text-sm text-slate-500 dark:text-slate-400">{{ fieldMetadata.suffix }}</span>
      </div>
      <TextInput
        v-else
        :id="fieldMetadata.path"
        :dataTestid="`${fieldMetadata.path}-input`"
        :type="fieldMetadata.type"
        :value="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        :errorMessage="errorMessage.value"
        :placeholder="fieldMetadata.placeholder"
        :data-field-state="inputFieldState(meta, !!errorMessage.value)"
        :class="{ '!border-[color:var(--vp-c-success-3)]': inputFieldState(meta, !!errorMessage.value) === 'valid' }"
        @input="handleChange(($event.target as HTMLInputElement).value)"
        @blur="handleBlur"
      />
    </template>

    <template #select-input="{ fieldMetadata, fieldContext: { value, meta, handleBlur, handleChange, errorMessage }, disabled }">
      <SelectInput
        :id="fieldMetadata.path"
        :dataTestid="`${fieldMetadata.path}-input`"
        :value="value.value"
        :options="fieldMetadata.options"
        :disabled="fieldMetadata.disabled || disabled"
        :errorMessage="errorMessage.value"
        :data-field-state="inputFieldState(meta, !!errorMessage.value)"
        :class="{ '!border-[color:var(--vp-c-success-3)]': inputFieldState(meta, !!errorMessage.value) === 'valid' }"
        @change="handleChange"
        @blur="handleBlur"
      />
    </template>
  </DynamicFormTemplate>
</template>
