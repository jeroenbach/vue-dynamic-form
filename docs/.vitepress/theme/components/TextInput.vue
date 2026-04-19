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
    class="h-9 w-full bg-gray-100 border-gray-200 border rounded px-3 text-sm"
  >
</template>
