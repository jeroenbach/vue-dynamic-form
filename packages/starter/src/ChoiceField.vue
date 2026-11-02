<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { GridColumnCount, Responsive } from '@/metadata';
import ErrorMessage from '@/ErrorMessage.vue';
import { gridColumnsClasses, gridItemClasses } from '@/gridClasses';
import OptionalRequiredTag from '@/OptionalRequiredTag.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  required?: boolean
  showRequiredOrOptional?: 'optional' | 'required'
  optionalText?: string
  disabled?: boolean
  errorMessage?: string
  dataTestid?: string
  /** Column count of the branch-fields grid; the `columns` field property. */
  columns?: Responsive<GridColumnCount>
  /** Parent-grid columns this choice spans; the `colSpan` field property. */
  colSpan?: Responsive<GridColumnCount | 'full'>
  /** Parent-grid column line this choice starts on; the `colStart` field property. */
  colStart?: Responsive<GridColumnCount>
}

defineProps<Props>();
</script>

<template>
  <section :data-testid="dataTestid" class="sft-choice-group" :class="gridItemClasses(colSpan, colStart)">
    <span class="sft-choice-group-title" :class="{ 'is-disabled': disabled }">
      {{ label }}
      <OptionalRequiredTag :required :show-required-or-optional :optionalText />
    </span>
    <p v-if="description" class="sft-choice-group-desc">
      {{ description }}
    </p>
    <div class="sft-choice-group-body" :class="gridColumnsClasses(columns)">
      <slot />
    </div>
    <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </section>
</template>
