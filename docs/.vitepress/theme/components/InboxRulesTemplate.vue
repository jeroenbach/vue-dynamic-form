<script lang="ts" setup>
import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';
import { ChoiceArraySectionCard, extendMetadata, StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import { toValue } from 'vue';
import FormField from './FormField.vue';
import InboxRuleRow from './InboxRuleRow.vue';

// #region template-metadata-contract
export type Metadata = GetMetadataType<typeof metadata>;

export type DynamicFormSettings = GetDynamicFormSettingsType<typeof metadata>;

const metadata = extendMetadata<{
  /** The rule list and every branch: never holds a value of its own. */
  rule: never
  number: number | undefined
  email: string
}>();
// #endregion template-metadata-contract

// A rule occurrence's own path is e.g. 'rules.subjectContains[2]'; stripping its own
// branch-and-index segment gives the containing choice's path ('rules'), which the row needs to
// write a reordered occurrence's `order` back through `setFieldValue`.
function rulesPathFor(occurrencePath?: string): string {
  return (occurrencePath ?? '').replace(/\.[^.[\]]+\[\d+\]$/, '');
}

/**
 * Lays out a rule's own fields: the size/unit pair side by side at roughly a 1fr/90px ratio, the
 * action select and its companion field as a dashed-divided pair below, everything else full
 * width. Keyed on field name rather than type, since text/email/select are reused by more than
 * one field with different widths.
 */
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
  <StarterFormTemplate :metadataConfiguration="metadata">
    <!-- Hands the engine's field and attribute renders to the built-in chrome. -->
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>

    <!-- #region rule-list-slots -->
    <template #rule-choice-array="{ fieldMetadata, fieldContext: { errorMessage, label }, addChoiceOccurrence, canAddChoiceOccurrence, usedChoiceOccurrences, activeChoiceOccurrences }">
      <ChoiceArraySectionCard
        :label
        :description="fieldMetadata.description"
        :errorMessage="errorMessage.value"
        :dataTestid="fieldMetadata.path"
        :options="fieldMetadata.choice.map((branch: any) => ({ value: branch.name, title: toValue(branch.fieldOptions?.label), description: branch.description }))"
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
    always render through the choice-array / choice-array-item slots above instead. The input
    itself still renders through the starter's own default-input / select-input chrome via the
    plain `<slot />` below. -->
    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, settings: { showRequiredOrOptional } }">
      <FormField
        v-show="!fieldMetadata.hide"
        :class="ruleFieldLayout(fieldMetadata.name)"
        :disabled="fieldMetadata.disabled || disabled"
        :inputId="fieldMetadata.path"
        :dataTestid="fieldMetadata.path"
        :description="fieldMetadata.description"
        :label
        :required
        :showRequiredOrOptional
        :errorMessage="errorMessage.value"
      >
        <slot />
      </FormField>
    </template>
  </StarterFormTemplate>
</template>
