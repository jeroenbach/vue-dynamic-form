<script lang="ts" setup>
import type { SelectHTMLAttributes } from 'vue';

export interface SelectOption {
  key: string
  value: string
}

// @vue-ignore keeps SelectHTMLAttributes out of props so attrs pass through to <select>.
export interface Props extends /* @vue-ignore */ SelectHTMLAttributes {
  options?: SelectOption[]
  placeholder?: string
  errorMessage?: string
}

// Vue merges class/style automatically, so callers can add classes without overriding base styles.
defineOptions({ inheritAttrs: false });

withDefaults(defineProps<Props>(), {
  options: () => [],
  placeholder: 'Select an option',
});
</script>

<template>
  <select
    v-bind="$attrs"
    :aria-invalid="!!errorMessage"
    class="h-10 w-full rounded-lg border bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400"
    :class="{
      'border-gray-200 focus:border-sky-500 focus:ring-sky-200': !errorMessage,
      'border-red-500 dark:border-rose-600 focus:border-red-500 dark:focus:border-rose-500 focus:ring-red-200 dark:focus:ring-rose-900': errorMessage,
    }"
  >
    <option value="">
      {{ placeholder }}
    </option>
    <option v-for="{ key, value } in options" :key="key" :value="key">
      {{ value }}
    </option>
  </select>
</template>
