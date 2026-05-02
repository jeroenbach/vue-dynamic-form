<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import ErrorMessage from './ErrorMessage.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  inputId?: string
  required?: boolean
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
    class="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border "
    :class="{
      'opacity-60': disabled,
      'border-slate-200 dark:border-slate-700': !errorMessage,
      'border-red-500 dark:border-rose-600 focus:ring-red-200 dark:focus:ring-rose-900': errorMessage,
    }"
  >
    <label :for="inputId" @click="emits('click')">
      <p class="text-sm font-medium text-slate-800 dark:text-slate-200">
        {{ label }}
        <span v-if="required" class="text-red-500 dark:text-rose-400">*</span>
      </p>
      <p v-if="description" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        {{ description }}
      </p>
      <ErrorMessage :error-message="errorMessage" :data-testid="dataTestid" />
    </label>
    <slot />
  </div>
</template>
