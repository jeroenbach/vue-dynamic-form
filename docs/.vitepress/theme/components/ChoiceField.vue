<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import ErrorMessage from './ErrorMessage.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  required?: boolean
  disabled?: boolean
  errorMessage?: string
  dataTestid?: string
}

defineProps<Props>();
</script>

<template>
  <section class="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-4 md:col-span-2">
    <div class="space-y-1">
      <span class="block text-sm font-semibold text-slate-900 dark:text-slate-100" :class="{ 'text-slate-400 dark:text-slate-500': disabled }">
        {{ label }}
        <span v-if="required" class="text-red-500 dark:text-rose-400">*</span>
      </span>
      <p v-if="description" class="text-sm text-slate-600 dark:text-slate-400">
        {{ description }}
      </p>
    </div>
    <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <slot />
    </div>
    <ErrorMessage :error-message="errorMessage" :data-testid="dataTestid" />
  </section>
</template>
