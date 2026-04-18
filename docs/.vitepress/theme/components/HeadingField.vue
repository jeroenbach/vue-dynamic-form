<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import ErrorMessage from './ErrorMessage.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  errorMessage?: string
  dataTestid?: string
}

defineProps<Props>();
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <div class="space-y-2">
      <h2 v-if="label" class="text-xl font-semibold text-slate-900">
        {{ label }}
      </h2>
      <p v-if="description" class="text-sm leading-6 text-slate-600">
        {{ description }}
      </p>
      <ErrorMessage :error-message="errorMessage" :data-testid="dataTestid" />
    </div>
    <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <slot />
    </div>
  </section>
</template>
