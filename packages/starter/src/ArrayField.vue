<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { GridColumnCount, Responsive } from '@/metadata';
import AppButton from '@/AppButton.vue';
import ErrorMessage from '@/ErrorMessage.vue';
import { gridColumnsClasses, gridItemClasses } from '@/gridClasses';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  itemsLength?: number
  itemsName?: string
  itemsNamePlural?: string
  description?: string
  disabled?: boolean
  canAddItems?: boolean
  addButtonText?: string
  errorMessage?: string
  dataTestid?: string
  /** Column count of the items grid; the `columns` field property. */
  columns?: Responsive<GridColumnCount>
  /** Parent-grid columns this field spans; the `colSpan` field property. */
  colSpan?: Responsive<GridColumnCount | 'full'>
  /** Parent-grid column line this field starts on; the `colStart` field property. */
  colStart?: Responsive<GridColumnCount>
}

withDefaults(defineProps<Props>(), {
  itemsName: 'item',
  itemsNamePlural: 'items',
  addButtonText: 'Add another',
});

defineEmits<{
  add: []
}>();
</script>

<template>
  <section
    :data-testid="dataTestid"
    class="sft-section sft-span-full"
    :class="[{ 'is-disabled': disabled }, gridItemClasses(colSpan, colStart)]"
  >
    <header class="sft-section-header">
      <div>
        <h2 class="sft-section-title">
          {{ label }}
        </h2>
        <p class="sft-section-desc">
          {{ description }}
        </p>
      </div>
      <span :data-testid="dataTestid ? `${dataTestid}-count` : undefined" class="sft-pill">
        {{ itemsLength }} {{ itemsLength === 1 ? itemsName : itemsNamePlural }}
      </span>
    </header>

    <div class="sft-grid sft-array-items" :class="gridColumnsClasses(columns)">
      <slot />
    </div>
    <div class="sft-array-footer">
      <AppButton
        v-if="canAddItems"
        :label="addButtonText"
        :dataTestid="dataTestid ? `${dataTestid}-add-button` : undefined"
        @click="$emit('add')"
      />
    </div>
    <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </section>
</template>
