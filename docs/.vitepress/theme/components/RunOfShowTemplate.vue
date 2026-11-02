<script lang="ts" setup>
import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';
import { extendMetadata, StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import { toValue } from 'vue';
import RunOfShowRow from './RunOfShowRow.vue';
import RunOfShowTimeline from './RunOfShowTimeline.vue';

// #region template-metadata-contract
export type Metadata = GetMetadataType<typeof metadata>;

export type DynamicFormSettings = GetDynamicFormSettingsType<typeof metadata>;

const metadata = extendMetadata<{
  /** The schedule-anchors card: a group wrapper, never a value of its own. */
  scheduleAnchors: never
  /** A native `<input type="time">` leaf; always a 24-hour `HH:MM` string. */
  time: string
  /** The program choice container and every one of its six branches: never a value of their own. */
  program: never
  /** The hidden curfew-check vehicle leaf: carries no value, exists only to hold validation. */
  curfew: never
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

    <!--
      The three schedule-anchor leaves are grouped under one wrapper purely so they can share one
      bordered card with a 3-up grid: the engine only produces one rendered element per group/
      parent node, and three independent root leaves could not otherwise share one card.
    -->
    <template #scheduleAnchors="{ fieldMetadata, fieldContext: { errorMessage, label } }">
      <section id="schedule-anchors" class="schedule-anchors-card rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h3 v-if="label" class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
          {{ label }}
        </h3>
        <p v-if="fieldMetadata.description" class="text-sm leading-6 text-slate-600 dark:text-slate-400 mb-4">
          {{ fieldMetadata.description }}
        </p>
        <span v-if="errorMessage.value" class="text-red-600 dark:text-rose-400 text-sm">{{ errorMessage.value }}</span>
        <div class="schedule-anchors-grid">
          <slot />
        </div>
      </section>
    </template>

    <!-- #region program-slots -->
    <template #program-choice-array="{ fieldMetadata, fieldContext: { errorMessage, label }, addChoiceOccurrence, canAddChoiceOccurrence, usedChoiceOccurrences }">
      <RunOfShowTimeline
        :hide="fieldMetadata.hide"
        :label
        :description="fieldMetadata.description"
        :error-message="errorMessage.value"
        :dataTestid="fieldMetadata.path"
        :options="fieldMetadata.choice.map((x: any) => ({ value: x.name, title: toValue(x.fieldOptions?.label), description: x.description }))"
        :addChoiceOccurrence
        :canAddChoiceOccurrence
        :usedChoiceOccurrences
        :maxOccurs="fieldMetadata.maxOccurs"
        :programPath="fieldMetadata.path ?? ''"
        :branches="fieldMetadata.choice.map((x: any) => ({ name: x.name ?? '', amplifiedByDefault: x.name === 'band' || x.name === 'dance' }))"
      >
        <slot />
      </RunOfShowTimeline>
    </template>

    <template #program-choice-array-item="{ fieldMetadata, fieldContext: { label }, branchKey, canRemoveItems, removeItem, index, globalIndex }">
      <RunOfShowRow
        :path="fieldMetadata.path ?? ''"
        :programPath="fieldMetadata.parent?.path ?? ''"
        :branches="(fieldMetadata.parent?.choice ?? []).map((x: any) => ({ name: x.name ?? '', amplifiedByDefault: x.name === 'band' || x.name === 'dance' }))"
        :branchKey
        :index
        :globalIndex
        :label
        :canRemove="canRemoveItems"
        @remove="removeItem"
      >
        <slot />
      </RunOfShowRow>
    </template>

    <!-- The curfew-check vehicle field carries no value and renders nothing in the builder: its
    message reaches the reader through the summary banner and the submit button's helper line,
    both read from the host's own derived curfew-breach state, not from this field's own slot. -->
    <template #curfew />
    <!-- #endregion program-slots -->

    <!-- A lightweight inline wrapper (toggle plus its own label), unlike the starter's bordered
    checkbox card: this page's one checkbox (a speech's on-the-mic flag) sits inline in its row's
    footer, next to the reorder controls, not as a standalone field. The inner slot still renders
    the starter's own toggle switch (via #checkbox-input), only the surrounding chrome changes. -->
    <template #checkbox="{ fieldMetadata, fieldContext: { label } }">
      <label v-show="!fieldMetadata.hide" class="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2" :data-testid="fieldMetadata.path">
        <slot />
        {{ label }}
      </label>
    </template>
  </StarterFormTemplate>
</template>

<style scoped>
.schedule-anchors-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 560px) {
  .schedule-anchors-grid {
    grid-template-columns: 1fr;
  }
}
</style>
