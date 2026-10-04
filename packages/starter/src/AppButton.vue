<script lang="ts" setup>
import type { ButtonHTMLAttributes } from 'vue';
import { computed } from 'vue';

export interface Props extends /* @vue-ignore */ ButtonHTMLAttributes {
  label?: string
  variant?: 'default' | 'danger' | 'danger-light' | 'primary' | 'ghost'
  dataTestid?: string
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  variant: 'default',
});

const variantClass = computed(() => `sft-btn-${props.variant}`);
</script>

<template>
  <button
    type="button"
    v-bind="$attrs"
    :data-testid="dataTestid"
    class="sft-btn"
    :class="variantClass"
  >
    <slot>
      {{ label }}
    </slot>
  </button>
</template>
