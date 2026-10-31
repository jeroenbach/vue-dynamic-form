<script lang="ts" setup>
import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';
import { defineMetadata, DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { toValue } from 'vue';
import CheckboxField from './CheckboxField.vue';
import ChoiceField from './ChoiceField.vue';
import ChoiceSectionCard from './ChoiceSectionCard.vue';
import FormField from './FormField.vue';
import GroupField from './GroupField.vue';
import SectionCard from './SectionCard.vue';
import SelectInput from './SelectInput.vue';
import SplitPaymentLedger from './SplitPaymentLedger.vue';
import SplitPaymentLedgerRow from './SplitPaymentLedgerRow.vue';
import TextareaWithCounter from './TextareaWithCounter.vue';
import TextInput from './TextInput.vue';
import ToggleSwitch from './ToggleSwitch.vue';

// #region template-metadata-contract
export type Metadata = GetMetadataType<typeof metadata>;

export type DynamicFormSettings = GetDynamicFormSettingsType<typeof metadata>;

const metadata = defineMetadata<
  {
    heading: never
    text: string
    email: string
    tel: string
    select: string
    checkbox: boolean | undefined
    textareaWithCounter: string
    /** The split-payment ledger container (a repeatable ordered choice): never holds a value of its own. */
    splitPayment: never
    /** A hidden vehicle field: never rendered as an input, only ever as its own validation error (the coverage banner). */
    splitPaymentCoverage: never
  },
  {
    description?: string
    placeholder?: string
    options?: { key: string, value: string }[]
    fullWidth?: boolean
    disabled?: boolean
    hide?: boolean
    /** Shown next to a choice branch's own fields; the branch that carries this flag is demo-only and collects no real payment data. */
    inertPaymentDisclaimer?: boolean
  },
  object,
  {
    showRequiredOrOptional?: 'optional' | 'required'
    /** The order total the split-payment ledger reconciles against. */
    orderTotal?: number
  }
>();
// #endregion template-metadata-contract

/**
 * A field is pristine until it has been touched once; after that it is either invalid (an
 * error message is showing) or valid. Drives both a data attribute (deterministic to assert
 * against) and the subtle "valid" border, which no reused input component carries today.
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
    <!--
      Every group/parent node in this template carries an explicit type: 'heading', including a
      choice branch that intentionally has no children (an inert branch, e.g. a redirect-only
      payment method): gating on children length here means such a branch renders nothing beyond
      its own picker entry, never a dangling empty card.
    -->
    <template #heading="{ fieldMetadata, fieldContext: { errorMessage, label } }">
      <SectionCard
        v-if="fieldMetadata.children?.length"
        v-show="!fieldMetadata.hide"
        class="md:col-span-2"
        :label
        :description="fieldMetadata.description"
        :error-message="errorMessage.value"
        :dataTestid="fieldMetadata.path"
      >
        <slot />
      </SectionCard>
    </template>

    <template #heading-choice="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, addChoiceOccurrence, removeChoiceOccurrence, activeChoiceOccurrences }">
      <ChoiceSectionCard
        v-show="!fieldMetadata.hide"
        class="md:col-span-2"
        :label
        :description="fieldMetadata.description"
        :errorMessage="errorMessage.value"
        :dataTestid="fieldMetadata.path"
        :options="fieldMetadata.choice.map(x => ({ value: x.name, title: toValue(x.fieldOptions?.label), description: x.description }))"
        :activeChoiceOccurrences
        :addChoiceOccurrence
        :disabled
        :removeChoiceOccurrence
      >
        <slot />
      </ChoiceSectionCard>
    </template>

    <template #splitPayment-choice-array="{ fieldMetadata, fieldContext: { errorMessage, label }, addChoiceOccurrence, canAddChoiceOccurrence, usedChoiceOccurrences, settings: { orderTotal } }">
      <SplitPaymentLedger
        v-show="!fieldMetadata.hide"
        class="md:col-span-2"
        :label
        :description="fieldMetadata.description"
        :error-message="errorMessage.value"
        :dataTestid="fieldMetadata.path"
        :options="fieldMetadata.choice.map(x => ({ value: x.name, title: toValue(x.fieldOptions?.label), description: x.description }))"
        :addChoiceOccurrence
        :canAddChoiceOccurrence
        :usedChoiceOccurrences
        :maxOccurs="fieldMetadata.maxOccurs"
        :splitPaymentPath="fieldMetadata.path ?? ''"
        :branches="fieldMetadata.choice.map(x => ({ name: x.name ?? '', coversRemainder: !x.children?.some(child => child.name === 'amount') }))"
        :orderTotal="orderTotal ?? 0"
      >
        <slot />
      </SplitPaymentLedger>
    </template>

    <template #splitPayment-choice-array-item="{ fieldMetadata, fieldContext: { label }, branchKey, canRemoveItems, removeItem, index, globalIndex, settings: { orderTotal } }">
      <SplitPaymentLedgerRow
        :path="fieldMetadata.path ?? ''"
        :splitPaymentPath="fieldMetadata.parent?.path ?? ''"
        :branches="(fieldMetadata.parent?.choice ?? []).map(x => ({ name: x.name ?? '', coversRemainder: !x.children?.some(child => child.name === 'amount') }))"
        :branchKey
        :index
        :globalIndex
        :label
        :canRemove="canRemoveItems"
        :orderTotal="orderTotal ?? 0"
        @remove="removeItem"
      >
        <slot />
      </SplitPaymentLedgerRow>
    </template>

    <!-- The coverage leaf renders no input at all: it exists purely as a validation vehicle, and
    its only visible output is this banner, driven entirely by its own error message. -->
    <template #splitPaymentCoverage="{ fieldMetadata, fieldContext: { errorMessage } }">
      <div
        v-if="errorMessage.value"
        class="md:col-span-2 flex items-start gap-2 rounded-lg border border-red-300 dark:border-rose-700 bg-red-50 dark:bg-rose-950 p-3 text-sm text-red-800 dark:text-rose-200"
        :data-testid="`${fieldMetadata.path}-banner`"
      >
        <span>⚠️</span>
        <span>{{ errorMessage.value }}</span>
      </div>
    </template>

    <!-- Fallback for a choice whose own type never matches a dedicated '<type>-choice' slot; unused by this story's shapes but kept so a future choice type falls back the same way AdvancedFormTemplate's does. -->
    <template #default-choice="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, settings: { showRequiredOrOptional } }">
      <ChoiceField
        v-show="!fieldMetadata.hide"
        :label
        :description="fieldMetadata.description"
        :required
        :show-required-or-optional
        :disabled="fieldMetadata.disabled || disabled"
        :error-message="errorMessage.value"
        :dataTestid="fieldMetadata.path"
      >
        <slot />
      </ChoiceField>
    </template>

    <template #checkbox="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, settings: { showRequiredOrOptional } }">
      <CheckboxField
        v-show="!fieldMetadata.hide"
        :input-id="fieldMetadata.path"
        :class="{ 'md:col-span-2': fieldMetadata.fullWidth }"
        :label
        :description="fieldMetadata.description"
        :required
        :show-required-or-optional
        :disabled="fieldMetadata.disabled || disabled"
        :error-message="errorMessage.value"
        :dataTestid="fieldMetadata.path"
      >
        <slot />
      </CheckboxField>
    </template>

    <template #checkbox-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange, errorMessage }, disabled }">
      <ToggleSwitch
        :id="fieldMetadata.path"
        :dataTestid="`${fieldMetadata.path}-input`"
        :checked="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        :errorMessage="errorMessage.value"
        @change="handleChange"
        @blur="handleBlur"
      />
    </template>

    <!-- Every leaf field (text/email/tel/select/textareaWithCounter) reaches here; a group node always declares type: 'heading' instead, so children.length is never set on this path. -->
    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, settings: { showRequiredOrOptional } }">
      <GroupField
        v-if="fieldMetadata.children?.length"
        v-show="!fieldMetadata.hide"
        class="md:col-span-2"
        :label
        :description="fieldMetadata.description"
        :required
        :show-required-or-optional
        :disabled="fieldMetadata.disabled || disabled"
        :error-message="errorMessage.value"
        :dataTestid="fieldMetadata.path"
      >
        <p v-if="fieldMetadata.inertPaymentDisclaimer" class="md:col-span-2 flex gap-2 items-start text-xs text-slate-500 dark:text-slate-400 border-l-2 border-slate-300 dark:border-slate-600 pl-3">
          <span>🔒</span>
          <span>These fields are <strong>inert demo inputs</strong>. They collect no real payment data and are not a payment integration.</span>
        </p>
        <slot />
      </GroupField>
      <FormField
        v-else
        v-show="!fieldMetadata.hide"
        :class="{ 'md:col-span-2': fieldMetadata.fullWidth }"
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

    <template #textareaWithCounter-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange, errorMessage }, disabled }">
      <TextareaWithCounter
        :id="fieldMetadata.path"
        :dataTestid="fieldMetadata.path"
        :value="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        :placeholder="fieldMetadata.placeholder"
        :errorMessage="errorMessage.value"
        :maxLength="fieldMetadata.restriction?.maxLength"
        @input="handleChange"
        @blur="handleBlur"
      />
    </template>
  </DynamicFormTemplate>
</template>
