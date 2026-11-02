<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { GridColumnCount, Responsive } from '@/metadata';
import ErrorMessage from '@/ErrorMessage.vue';
import { gridItemClasses } from '@/gridClasses';
import OptionalRequiredTag from '@/OptionalRequiredTag.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  inputId?: string
  required?: boolean
  showRequiredOrOptional?: 'optional' | 'required'
  optionalText?: string
  disabled?: boolean
  errorMessage?: string
  dataTestid?: string
  /** Parent-grid columns this field spans; the `colSpan` field property. */
  colSpan?: Responsive<GridColumnCount | 'full'>
  /** Parent-grid column line this field starts on; the `colStart` field property. */
  colStart?: Responsive<GridColumnCount>
}

export interface Emits {
  (e: 'click'): void
}

defineProps<Props>();
const emits = defineEmits<Emits>();
</script>

<template>
  <div
    :data-testid="dataTestid"
    class="sft-switch-field"
    :class="[{ 'is-disabled': disabled, 'is-invalid': !!errorMessage }, gridItemClasses(colSpan, colStart)]"
  >
    <label :for="inputId" @click="emits('click')">
      <p class="sft-switch-field-label">
        {{ label }}
        <OptionalRequiredTag :required :show-required-or-optional :optionalText />
      </p>
      <p v-if="description" class="sft-switch-field-desc">
        {{ description }}
      </p>
      <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
    </label>
    <slot />
  </div>
</template>
