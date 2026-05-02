<script lang="ts" setup>
import type { InputHTMLAttributes } from 'vue';

// @vue-ignore keeps InputHTMLAttributes out of props so attrs pass through to <input>.
export interface Props extends /* @vue-ignore */ InputHTMLAttributes {
  errorMessage?: string
}

// Vue merges class/style automatically, so callers can add classes without overriding base styles.
defineOptions({ inheritAttrs: false });
defineProps<Props>();
</script>

<template>
  <input
    type="text"
    v-bind="$attrs"
    class="h-10 w-full rounded-lg border bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400"
    :class="{
      'border-gray-200 focus:border-sky-500 focus:ring-sky-200': !errorMessage,
      'border-red-500 dark:border-rose-600 focus:border-red-500 dark:focus:border-rose-500 focus:ring-red-200 dark:focus:ring-rose-900': errorMessage,
    }"
    :aria-invalid="!!errorMessage"
  >
</template>
