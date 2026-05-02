<script lang="ts" setup>
import type { ButtonHTMLAttributes } from 'vue';

export interface Props extends /* @vue-ignore */ ButtonHTMLAttributes {
  label?: string
  variant?: 'default' | 'danger' | 'danger-light' | 'primary' | 'ghost'
}

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<Props>(), {
  label: undefined,
  variant: 'default',
});
</script>

<template>
  <button
    v-bind="$attrs"
    type="button"
    class="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
    :class="{
      'border border-red-200 dark:border-rose-800 bg-red-50 dark:bg-rose-950 text-red-700 dark:text-rose-400 hover:border-red-400 dark:hover:border-rose-600 hover:bg-red-100 dark:hover:bg-rose-900': variant === 'danger',
      'text-red-700 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950 disabled:hover:bg-transparent': variant === 'danger-light',
      'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800': variant === 'default',
      'border border-slate-300 bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2': variant === 'primary',
      'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100': variant === 'ghost',
    }"
  >
    <slot>
      {{ label }}
    </slot>
  </button>
</template>
