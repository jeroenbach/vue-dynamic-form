<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import AppButton from '@/AppButton.vue';
import ErrorMessage from '@/ErrorMessage.vue';
import OptionalRequiredTag from '@/OptionalRequiredTag.vue';

export interface Props {
  inputId?: string
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  disabled?: boolean
  required?: boolean
  showRequiredOrOptional?: 'optional' | 'required'
  dependentOnMessage?: string
  errorMessage?: string
  canRemoveItems?: boolean
  dataTestid?: string
}
defineProps<Props>();
defineEmits<{
  removeItem: []
}>();
</script>

<template>
  <div
    :data-testid="dataTestid"
    class="sft-field"
    :class="{ 'is-disabled': disabled }"
  >
    <label class="sft-field-label" :for="inputId">
      {{ label }}
      <OptionalRequiredTag :required :show-required-or-optional />
    </label>
    <div v-if="dependentOnMessage" class="sft-dependent">
      {{ dependentOnMessage }}
    </div>
    <div v-else class="sft-field-control-row">
      <div class="sft-field-control">
        <slot />
      </div>
      <AppButton
        v-if="canRemoveItems"
        label="Remove"
        variant="danger"
        :dataTestid="dataTestid ? `${dataTestid}-remove-button` : undefined"
        @click="$emit('removeItem')"
      />
    </div>
    <p v-if="description" class="sft-field-desc">
      {{ description }}
    </p>
    <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </div>
</template>
