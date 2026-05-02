<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import ErrorMessage from './ErrorMessage.vue';

export interface Props {
  inputId?: string
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  disabled?: boolean
  required?: boolean
  dependentOnMessage?: string
  errorMessage?: string
  canRemoveItems?: boolean
}
defineProps<Props>();
defineEmits<{
  removeItem: []
}>();
</script>

<template>
  <div
    class="flex flex-col gap-2"
    :class="{ 'opacity-60': disabled }"
  >
    <label class="flex justify-between" :for="inputId">
      {{ label }}
      <span
        v-if="!required"
        class="optional-tag inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400"
      >
        Optional
      </span>
    </label>
    <div
      v-if="dependentOnMessage"
      class="h-10 grid place-items-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400"
    >
      {{ dependentOnMessage }}
    </div>
    <div v-else class="flex items-start gap-2">
      <div class="grow">
        <slot />
      </div>
      <AppButton
        v-if="canRemoveItems"
        label="Remove"
        variant="danger"
        @click="$emit('removeItem')"
      />
    </div>
    <p v-if="description" class="text-sm leading-5 text-slate-500 dark:text-slate-400">
      {{ description }}
    </p>
    <ErrorMessage :error-message="errorMessage" :data-testid="`${inputId}-error-message`" />
  </div>
</template>
