<script setup lang="ts">
import type { MaybeRefOrGetter } from 'vue';
import type { GridColumnCount, Responsive } from '@/metadata';
import { computed } from 'vue';
import AppButton from '@/AppButton.vue';
import { gridColumnsClasses, gridItemClasses } from '@/gridClasses';
import StarterIcon from '@/StarterIcon.vue';

interface Props {
  index: number
  /** Overrides the badge/aria-label number; falls back to `index + 1` when omitted. */
  displayNumber?: number
  title?: MaybeRefOrGetter<string | undefined>
  placeholderTitle?: string
  canRemove?: boolean
  removeButtonText?: string
  /** Aria label of the remove button; `{number}` is replaced by the item number. */
  removeAriaLabel?: string
  dataTestid?: string
  /** Column count of the children grid; the `columns` field property. */
  columns?: Responsive<GridColumnCount>
  /** Parent-grid columns this card spans; the `colSpan` field property. */
  colSpan?: Responsive<GridColumnCount | 'full'>
  /** Parent-grid column line this card starts on; the `colStart` field property. */
  colStart?: Responsive<GridColumnCount>
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  placeholderTitle: 'New item',
  canRemove: true,
  removeButtonText: 'Remove',
  removeAriaLabel: 'Remove item {number}',
});

defineEmits<{
  remove: []
}>();

const removeLabel = computed(() =>
  props.removeAriaLabel.replace('{number}', String(props.displayNumber ?? props.index + 1)));
</script>

<template>
  <article :data-testid="dataTestid" class="sft-repeater" :class="gridItemClasses(colSpan, colStart)">
    <header class="sft-repeater-header">
      <div class="sft-repeater-title-group">
        <span class="sft-repeater-badge">
          {{ displayNumber ?? index + 1 }}
        </span>
        <p class="sft-repeater-title">
          {{ title || placeholderTitle }}
        </p>
      </div>
      <AppButton
        variant="danger-light"
        :disabled="!canRemove"
        :dataTestid="dataTestid ? `${dataTestid}-remove-button` : undefined"
        :aria-label="removeLabel"
        @click="$emit('remove')"
      >
        <StarterIcon name="trash" />
        {{ removeButtonText }}
      </AppButton>
    </header>
    <div class="sft-grid" :class="gridColumnsClasses(columns)">
      <slot />
    </div>
  </article>
</template>
