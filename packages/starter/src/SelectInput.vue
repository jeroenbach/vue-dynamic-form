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
  // Declared explicitly (rather than left to attrs forwarding) so it reaches the DOM as the
  // literal `data-testid` attribute instead of the camelCase key a plain $attrs spread would set.
  dataTestid?: string
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
    :data-testid="dataTestid"
    :aria-invalid="!!errorMessage"
    class="sft-select"
    :class="{ 'is-invalid': !!errorMessage }"
  >
    <option value="">
      {{ placeholder }}
    </option>
    <option v-for="{ key, value } in options" :key="key" :value="key">
      {{ value }}
    </option>
  </select>
</template>
