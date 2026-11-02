<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { GridColumnCount, Responsive } from '@/metadata';
import AppButton from '@/AppButton.vue';
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
  canAddItems?: boolean
  canRemoveItems?: boolean
  addButtonText?: string
  removeButtonText?: string
  errorMessage?: string
  dataTestid?: string
  /** Column count of the children grid; the `columns` field property. */
  columns?: Responsive<GridColumnCount>
  /** Parent-grid columns this group spans; the `colSpan` field property. */
  colSpan?: Responsive<GridColumnCount | 'full'>
  /** Parent-grid column line this group starts on; the `colStart` field property. */
  colStart?: Responsive<GridColumnCount>
}

withDefaults(defineProps<Props>(), {
  addButtonText: 'Add',
  removeButtonText: 'Remove',
});

defineEmits<{
  add: []
  remove: []
}>();
</script>

<template>
  <section
    :data-testid="dataTestid"
    class="sft-group sft-span-full"
    :class="[{ 'is-disabled': disabled }, gridItemClasses(colSpan, colStart)]"
  >
    <div class="sft-group-header">
      <div class="sft-group-heading">
        <span class="sft-choice-group-title">
          {{ label }}
          <OptionalRequiredTag v-if="showRequiredOrOptional === 'optional'" :required :show-required-or-optional :optionalText />
        </span>
        <p v-if="description" class="sft-field-desc">
          {{ description }}
        </p>
      </div>
      <div v-if="canAddItems || canRemoveItems" class="sft-group-actions">
        <AppButton
          v-if="canAddItems"
          :label="addButtonText"
          :dataTestid="dataTestid ? `${dataTestid}-add-button` : undefined"
          @click="$emit('add')"
        />
        <AppButton
          v-if="canRemoveItems"
          :label="removeButtonText"
          variant="danger"
          :dataTestid="dataTestid ? `${dataTestid}-remove-button` : undefined"
          @click="$emit('remove')"
        />
      </div>
    </div>
    <div
      class="sft-choice-group-body"
      :class="[{ 'sft-hide-tag': showRequiredOrOptional === 'optional' }, gridColumnsClasses(columns)]"
    >
      <slot />
    </div>
    <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </section>
</template>
