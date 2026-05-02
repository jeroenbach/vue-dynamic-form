<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import ErrorMessage from './ErrorMessage.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  tag?: string
  errorMessage?: string
  dataTestid?: string
}

defineProps<Props>();
</script>

<template>
  <section class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
    <header class="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 v-if="label" class="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {{ label }}
        </h2>
        <p v-if="description" class="text-sm leading-6 text-slate-600 dark:text-slate-400">
          {{ description }}
        </p>
        <ErrorMessage :error-message="errorMessage" :data-testid="dataTestid" />
      </div>
      <span v-if="tag" class="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
        {{ tag }}
      </span>
    </header>
    <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <slot />
    </div>
    <slot name="footer" />
  </section>
</template>
