<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { GridColumnCount, Responsive } from '@/metadata';
import AppButton from '@/AppButton.vue';
import ErrorMessage from '@/ErrorMessage.vue';
import { gridItemClasses } from '@/gridClasses';
import OptionalRequiredTag from '@/OptionalRequiredTag.vue';

export interface Props {
  inputId?: string
  label?: MaybeRefOrGetter<string | undefined>
  /**
   * Renders the label as a plain span instead of a `<label for>`. For a grouped control
   * (e.g. a radio group) the slot holds several inputs that each have their own label, so a
   * `for` pointing at one of them would give that input two labels. The group associates
   * itself with the span through aria-labelledby on the `{inputId}-label` id instead.
   */
  groupLabel?: boolean
  description?: string
  disabled?: boolean
  required?: boolean
  showRequiredOrOptional?: 'optional' | 'required'
  optionalText?: string
  dependentOnMessage?: string
  errorMessage?: string
  canRemoveItems?: boolean
  removeButtonText?: string
  dataTestid?: string
  /** Parent-grid columns this field spans; the `colSpan` field property. */
  colSpan?: Responsive<GridColumnCount | 'full'>
  /** Parent-grid column line this field starts on; the `colStart` field property. */
  colStart?: Responsive<GridColumnCount>
}
withDefaults(defineProps<Props>(), {
  removeButtonText: 'Remove',
});
defineEmits<{
  removeItem: []
}>();
</script>

<template>
  <div
    :data-testid="dataTestid"
    class="sft-field"
    :class="[{ 'is-disabled': disabled }, gridItemClasses(colSpan, colStart)]"
  >
    <component
      :is="groupLabel ? 'span' : 'label'"
      :id="inputId ? `${inputId}-label` : undefined"
      class="sft-field-label"
      :for="groupLabel ? undefined : inputId"
    >
      {{ label }}
      <OptionalRequiredTag :required :show-required-or-optional :optionalText />
    </component>
    <div v-if="dependentOnMessage" class="sft-dependent">
      {{ dependentOnMessage }}
    </div>
    <div v-else class="sft-field-control-row">
      <div class="sft-field-control">
        <slot />
      </div>
      <AppButton
        v-if="canRemoveItems"
        :label="removeButtonText"
        variant="danger"
        :dataTestid="dataTestid ? `${dataTestid}-remove-button` : undefined"
        @click="$emit('removeItem')"
      />
    </div>
    <p v-if="description" :id="inputId ? `${inputId}-desc` : undefined" class="sft-field-desc">
      {{ description }}
    </p>
    <ErrorMessage :id="errorMessage && inputId ? `${inputId}-error` : undefined" :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </div>
</template>
