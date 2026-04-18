<script lang="ts" setup>
import type { InputHTMLAttributes, MaybeRefOrGetter } from 'vue';

// @vue-ignore keeps InputHTMLAttributes out of props so attrs pass through to <input>.
export interface Props extends /* @vue-ignore */ InputHTMLAttributes {
  label?: MaybeRefOrGetter<string | undefined>
  checked?: boolean
}

// attrs land on <input>, not the outer <label> — Vue merges class/style automatically.
defineOptions({ inheritAttrs: false });

withDefaults(defineProps<Props>(), {
  label: 'Yes',
});
</script>

<template>
  <label class="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
    <input
      v-bind="$attrs"
      type="checkbox"
      :checked="checked"
      class="h-4 w-4"
    >
    <span>{{ label }}</span>
  </label>
</template>
