<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import AppButton from './AppButton.vue';
import ErrorMessage from './ErrorMessage.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  itemsLength?: number
  description?: string
  required?: boolean
  disabled?: boolean
  canAddItems?: boolean
  errorMessage?: string
  dataTestid?: string
}

defineProps<Props>();

defineEmits<{
  add: []
}>();
</script>

<template>
  <section class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm" :class="{ 'opacity-60': disabled }">
    <header class="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {{ label }}
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          {{ description }}
        </p>
      </div>
      <span class="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
        {{ itemsLength }} {{ itemsLength === 1 ? 'item' : 'items' }}
      </span>
    </header>

    <div class="grid grid-cols-1 gap-4">
      <slot />
    </div>
    <div>
      <AppButton
        v-if="canAddItems"
        label="Add another"
        @click="$emit('add')"
      />
    </div>
    <ErrorMessage :error-message="errorMessage" :data-testid="dataTestid" />
  </section>
</template>
