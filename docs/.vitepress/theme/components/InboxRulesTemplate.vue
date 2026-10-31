<script lang="ts" setup>
import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';
import { defineMetadata, DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { toValue } from 'vue';
import ChoiceArraySectionCard from './ChoiceArraySectionCard.vue';
import FormField from './FormField.vue';
import InboxRuleRow from './InboxRuleRow.vue';
import SelectInput from './SelectInput.vue';
import TextInput from './TextInput.vue';

// #region template-metadata-contract
export type Metadata = GetMetadataType<typeof metadata>;

export type DynamicFormSettings = GetDynamicFormSettingsType<typeof metadata>;

const metadata = defineMetadata<
  {
    /** The rule list and every branch: never holds a value of its own. */
    rule: never
    text: string
    email: string
    number: number | undefined
    select: string
  },
  {
    description?: string
    placeholder?: string
    options?: { key: string, value: string }[]
    fullWidth?: boolean
    disabled?: boolean
    hide?: boolean
  },
  object,
  {
    showRequiredOrOptional?: 'optional' | 'required'
  }
>();
// #endregion template-metadata-contract

/**
 * A field is pristine until it has been touched once; after that it is either invalid (an
 * error message is showing) or valid. Drives both a data attribute (deterministic to assert
 * against) and the subtle "valid" border.
 */
function inputFieldState(meta: { valid: boolean, touched: boolean }, hasError: boolean): 'pristine' | 'invalid' | 'valid' {
  if (hasError)
    return 'invalid';
  if (meta.touched && meta.valid)
    return 'valid';
  return 'pristine';
}

/**
 * Lays out a rule's own fields: the size/unit pair side by side at roughly a 1fr/90px ratio, the
 * action select and its companion field as a dashed-divided pair below, everything else full
 * width. Keyed on field name rather than type, since text/email/select are reused by more than
 * one field with different widths.
 */
// A rule occurrence's own path is e.g. 'rules.subjectContains[2]'; stripping its own
// branch-and-index segment gives the containing choice's path ('rules'), which the row needs to
// write a reordered occurrence's `order` back through `setFieldValue`.
function rulesPathFor(occurrencePath?: string): string {
  return (occurrencePath ?? '').replace(/\.[^.[\]]+\[\d+\]$/, '');
}

function ruleFieldLayout(name?: string): string {
  switch (name) {
    case 'size':
      return 'grow basis-[160px] min-w-[140px]';
    case 'unit':
      return 'w-[90px] shrink-0 grow-0';
    case 'action':
      return 'basis-full grow border-t border-dashed border-slate-300 dark:border-slate-600 pt-3 mt-1';
    case 'folder':
    case 'label':
    case 'forwardTo':
      return 'basis-full grow';
    default:
      return 'basis-full';
  }
}
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <!-- #region rule-list-slots -->
    <template #rule-choice-array="{ fieldMetadata, fieldContext: { errorMessage, label }, addChoiceOccurrence, canAddChoiceOccurrence, usedChoiceOccurrences, activeChoiceOccurrences }">
      <ChoiceArraySectionCard
        :label
        :description="fieldMetadata.description"
        :errorMessage="errorMessage.value"
        :dataTestid="fieldMetadata.path"
        :options="fieldMetadata.choice.map(branch => ({ value: branch.name, title: toValue(branch.fieldOptions?.label), description: branch.description }))"
        :addChoiceOccurrence
        :canAddChoiceOccurrence
        :usedChoiceOccurrences
        :maxOccurs="fieldMetadata.maxOccurs"
      >
        <div
          v-if="!activeChoiceOccurrences.length"
          class="md:col-span-2 grid place-items-center gap-1 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400"
          :data-testid="`${fieldMetadata.path}-empty-state`"
        >
          <strong class="text-slate-700 dark:text-slate-300">No rules yet.</strong>
          <span>Until then, every message stays in the Inbox.</span>
        </div>
        <div v-else class="md:col-span-2 flex flex-col gap-3">
          <slot />
        </div>
      </ChoiceArraySectionCard>
    </template>

    <template #rule-choice-array-item="{ fieldMetadata, fieldContext: { label }, branchKey, globalIndex, canRemoveItems, removeItem }">
      <InboxRuleRow
        :path="fieldMetadata.path ?? ''"
        :rulesPath="rulesPathFor(fieldMetadata.path)"
        :branchKey
        :globalIndex
        :label
        :canRemove="canRemoveItems"
        @remove="removeItem"
      >
        <slot />
      </InboxRuleRow>
    </template>
    <!-- #endregion rule-list-slots -->

    <!-- Every leaf field (text/email/number/select) reaches here; the rule list and its branches
    always render through the choice-array / choice-array-item slots above instead. -->
    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, settings: { showRequiredOrOptional } }">
      <FormField
        v-show="!fieldMetadata.hide"
        :class="ruleFieldLayout(fieldMetadata.name)"
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

    <template #default-input="{ fieldMetadata, fieldContext: { value, meta, handleBlur, handleChange, errorMessage }, disabled }">
      <TextInput
        :id="fieldMetadata.path"
        :dataTestid="`${fieldMetadata.path}-input`"
        :type="fieldMetadata.type"
        :value="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        :errorMessage="errorMessage.value"
        :placeholder="fieldMetadata.placeholder"
        :data-field-state="inputFieldState(meta, !!errorMessage.value)"
        :class="{ '!border-[color:var(--vp-c-success-3)]': inputFieldState(meta, !!errorMessage.value) === 'valid' }"
        @input="handleChange"
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
