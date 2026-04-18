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
    class="h-9 w-full rounded border border-gray-200 bg-gray-100 px-3 text-sm"
  >
    <option value="">
      {{ placeholder }}
    </option>
    <option v-for="{ key, value } in options" :key="key" :value="key">
      {{ value }}
    </option>
  </select>
</template>
