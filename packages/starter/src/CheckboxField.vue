<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import ErrorMessage from '@/ErrorMessage.vue';
import OptionalRequiredTag from '@/OptionalRequiredTag.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  inputId?: string
  required?: boolean
  showRequiredOrOptional?: 'optional' | 'required'
  disabled?: boolean
  errorMessage?: string
  dataTestid?: string
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
    :class="{ 'is-disabled': disabled, 'is-invalid': !!errorMessage }"
  >
    <label :for="inputId" @click="emits('click')">
      <p class="sft-switch-field-label">
        {{ label }}
        <OptionalRequiredTag :required :show-required-or-optional />
      </p>
      <p v-if="description" class="sft-switch-field-desc">
        {{ description }}
      </p>
      <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
    </label>
    <slot />
  </div>
</template>
