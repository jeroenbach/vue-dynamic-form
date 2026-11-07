<script lang="ts" setup>
import type { TextareaHTMLAttributes } from 'vue';

// @vue-ignore keeps TextareaHTMLAttributes out of props so attrs pass through to <textarea>.
export interface Props extends /* @vue-ignore */ TextareaHTMLAttributes {
  errorMessage?: string
  // Declared explicitly (rather than left to attrs forwarding) so it reaches the DOM as the
  // literal `data-testid` attribute instead of the camelCase key a plain $attrs spread would set.
  dataTestid?: string
}

// Vue merges class/style automatically, so callers can add classes without overriding base styles.
defineOptions({ inheritAttrs: false });
defineProps<Props>();
</script>

<template>
  <textarea
    v-bind="$attrs"
    :data-testid="dataTestid"
    class="sft-textarea"
    :class="{ 'is-invalid': !!errorMessage }"
    :aria-invalid="!!errorMessage"
  />
</template>
