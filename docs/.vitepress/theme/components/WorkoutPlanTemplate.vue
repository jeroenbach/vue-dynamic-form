<script lang="ts" setup>
import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';
import { ChoiceArraySectionCard, extendMetadata, StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import { toValue } from 'vue';
import WorkoutBlockRow from './WorkoutBlockRow.vue';

// #region template-metadata-contract
export type Metadata = GetMetadataType<typeof metadata>;

export type DynamicFormSettings = GetDynamicFormSettingsType<typeof metadata>;

const metadata = extendMetadata<{
  /** The plan choice and every block branch: a container with no value of its own. */
  block: never
  number: number | undefined
}>();
// #endregion template-metadata-contract
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

    <template #block-choice-array="{ fieldMetadata, fieldContext: { errorMessage, label }, addChoiceOccurrence, canAddChoiceOccurrence, usedChoiceOccurrences, activeChoiceOccurrences }">
      <ChoiceArraySectionCard
        class="md:col-span-2"
        :label
        :description="fieldMetadata.description"
        :error-message="errorMessage.value"
        :dataTestid="fieldMetadata.path"
        :options="fieldMetadata.choice.map((x: any) => ({ value: x.name, title: toValue(x.fieldOptions?.label) }))"
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
        :branches="(fieldMetadata.parent?.choice ?? []).map((x: any) => ({ name: x.name ?? '' }))"
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
  </StarterFormTemplate>
</template>
