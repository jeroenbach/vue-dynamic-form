<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { GridColumnCount, Responsive } from '@/metadata';
import ErrorMessage from '@/ErrorMessage.vue';
import { gridColumnsClasses, gridItemClasses } from '@/gridClasses';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  tag?: string
  errorMessage?: string
  dataTestid?: string
  /** Column count of the children grid; the `columns` field property. */
  columns?: Responsive<GridColumnCount>
  /** Parent-grid columns this card spans; the `colSpan` field property. */
  colSpan?: Responsive<GridColumnCount | 'full'>
  /** Parent-grid column line this card starts on; the `colStart` field property. */
  colStart?: Responsive<GridColumnCount>
}

defineProps<Props>();
</script>

<template>
  <section :data-testid="dataTestid" class="sft-section" :class="gridItemClasses(colSpan, colStart)">
    <header class="sft-section-header">
      <div>
        <h2 v-if="label" class="sft-section-title">
          {{ label }}
        </h2>
        <p v-if="description" class="sft-section-desc">
          {{ description }}
        </p>
        <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
      </div>
      <span v-if="tag" class="sft-pill">
        {{ tag }}
      </span>
    </header>
    <div class="sft-grid" :class="gridColumnsClasses(columns)">
      <slot />
    </div>
    <slot name="footer" />
  </section>
</template>
