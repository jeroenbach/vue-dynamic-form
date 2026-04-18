<script lang="ts" setup>
import type { ButtonHTMLAttributes } from 'vue';

export interface Props extends /* @vue-ignore */ ButtonHTMLAttributes {
  label?: string
  variant?: 'default' | 'danger'
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
    class="rounded-md px-3 py-2 text-sm font-medium"
    :class="variant === 'danger'
      ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'"
  >
    {{ label }}
  </button>
</template>
