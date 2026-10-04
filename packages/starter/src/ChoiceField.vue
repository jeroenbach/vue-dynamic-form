<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import ErrorMessage from '@/ErrorMessage.vue';
import OptionalRequiredTag from '@/OptionalRequiredTag.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  required?: boolean
  showRequiredOrOptional?: 'optional' | 'required'
  disabled?: boolean
  errorMessage?: string
  dataTestid?: string
}

defineProps<Props>();
</script>

<template>
  <section :data-testid="dataTestid" class="sft-choice-group">
    <span class="sft-choice-group-title" :class="{ 'is-disabled': disabled }">
      {{ label }}
      <OptionalRequiredTag :required :show-required-or-optional />
    </span>
    <p v-if="description" class="sft-choice-group-desc">
      {{ description }}
    </p>
    <div class="sft-choice-group-body">
      <slot />
    </div>
    <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </section>
</template>
