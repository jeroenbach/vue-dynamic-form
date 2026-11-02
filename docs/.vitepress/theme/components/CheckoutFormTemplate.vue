<script lang="ts" setup>
import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';
import type { SplitPaymentBranchShape } from './splitPaymentLedgerMath';
import { extendMetadata, StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import { toValue } from 'vue';
import SplitPaymentLedger from './SplitPaymentLedger.vue';
import SplitPaymentLedgerRow from './SplitPaymentLedgerRow.vue';
import TextareaWithCounter from './TextareaWithCounter.vue';

// #region template-metadata-contract
export type Metadata = GetMetadataType<typeof metadata>;

export type DynamicFormSettings = GetDynamicFormSettingsType<typeof metadata>;

const metadata = extendMetadata<
  {
    textareaWithCounter: string
    /** The split-payment ledger container (a repeatable ordered choice): never holds a value of its own. */
    splitPayment: never
    /** A hidden vehicle field: never rendered as an input, only ever as its own validation error (the coverage banner). */
    splitPaymentCoverage: never
    email: string
    tel: string
    /** A value-less informational paragraph, e.g. the inert-payment notice next to a branch's own fields. */
    disclaimer: never
  },
  {
    /** Shown next to a choice branch's own fields; the branch that carries this flag is demo-only and collects no real payment data. */
    inertPaymentDisclaimer?: boolean
  },
  object,
  {
    /** The order total the split-payment ledger reconciles against. */
    orderTotal?: number
  }
>();
// #endregion template-metadata-contract

// Explicitly typed (rather than inlined in the template): `.map()`'s callback parameter does
// not get inferred from a choice branch array reached through this many layers of generics, and
// would otherwise come out implicitly `any`.
function toChoiceOptions(choice: Metadata['choice']) {
  return (choice ?? []).map(x => ({ value: x.name ?? '', title: toValue(x.fieldOptions?.label), description: x.description }));
}

function toBranchShapes(choice: Metadata['choice']): SplitPaymentBranchShape[] {
  return (choice ?? []).map(x => ({ name: x.name ?? '', coversRemainder: !x.children?.some(child => child.name === 'amount') }));
}
</script>

<template>
  <StarterFormTemplate :metadataConfiguration="metadata">
    <!-- Hands the engine's field and attribute renders to the built-in chrome. -->
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>

    <template #splitPayment-choice-array="{ fieldMetadata, fieldContext: { errorMessage, label }, addChoiceOccurrence, canAddChoiceOccurrence, usedChoiceOccurrences, settings: { orderTotal } }">
      <SplitPaymentLedger
        v-show="!fieldMetadata.hide"
        class="md:col-span-2"
        :label
        :description="fieldMetadata.description"
        :error-message="errorMessage.value"
        :dataTestid="fieldMetadata.path"
        :options="toChoiceOptions(fieldMetadata.choice)"
        :addChoiceOccurrence
        :canAddChoiceOccurrence
        :usedChoiceOccurrences
        :maxOccurs="fieldMetadata.maxOccurs"
        :splitPaymentPath="fieldMetadata.path ?? ''"
        :branches="toBranchShapes(fieldMetadata.choice)"
        :orderTotal="orderTotal ?? 0"
      >
        <slot />
      </SplitPaymentLedger>
    </template>

    <template #splitPayment-choice-array-item="{ fieldMetadata, fieldContext: { label }, branchKey, canRemoveItems, removeItem, index, globalIndex, settings: { orderTotal } }">
      <SplitPaymentLedgerRow
        :path="fieldMetadata.path ?? ''"
        :splitPaymentPath="fieldMetadata.parent?.path ?? ''"
        :branches="toBranchShapes(fieldMetadata.parent?.choice)"
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

    <!-- A value-less leaf: the same trick as the coverage banner above, but for a static notice
    rather than a validation message. Keeps the inert-payment copy out of the shared group chrome. -->
    <template #disclaimer="{ fieldMetadata }">
      <p
        v-show="!fieldMetadata.hide"
        class="md:col-span-2 flex gap-2 items-start text-xs text-slate-500 dark:text-slate-400 border-l-2 border-slate-300 dark:border-slate-600 pl-3"
        :data-testid="fieldMetadata.path"
      >
        <span>🔒</span>
        <span>These fields are <strong>inert demo inputs</strong>. They collect no real payment data and are not a payment integration.</span>
      </p>
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
  </StarterFormTemplate>
</template>
