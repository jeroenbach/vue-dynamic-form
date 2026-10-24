<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import AppButton from '@/AppButton.vue';
import ErrorMessage from '@/ErrorMessage.vue';
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
    class="sft-group"
    :class="{ 'is-disabled': disabled }"
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
      :class="{ 'sft-hide-tag': showRequiredOrOptional === 'optional' }"
    >
      <slot />
    </div>
    <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </section>
</template>
