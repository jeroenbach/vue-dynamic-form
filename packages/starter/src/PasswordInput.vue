<script lang="ts" setup>
import { ref } from 'vue';
import StarterIcon from '@/StarterIcon.vue';

export interface Props {
  id?: string
  value?: string | unknown
  placeholder?: string
  disabled?: boolean
  errorMessage?: string
  showPasswordAriaLabel?: string
  hidePasswordAriaLabel?: string
  dataTestid?: string
}

// Non-prop attrs (e.g. a caller's class or data-field-state) land on the input via $attrs
// below, not on the wrapping div, since inheritAttrs is off.
defineOptions({ inheritAttrs: false });

withDefaults(defineProps<Props>(), {
  showPasswordAriaLabel: 'Show password',
  hidePasswordAriaLabel: 'Hide password',
});
const emit = defineEmits<{
  input: [event: Event]
  blur: []
}>();

const showPassword = ref(false);
</script>

<template>
  <div :data-testid="dataTestid" class="sft-password">
    <input
      :id
      v-bind="$attrs"
      :data-testid="dataTestid ? `${dataTestid}-input` : undefined"
      :type="showPassword ? 'text' : 'password'"
      :value="(value as string | undefined)"
      :placeholder
      :disabled
      class="sft-input"
      :class="{ 'is-invalid': !!errorMessage }"
      :aria-invalid="!!errorMessage"
      @input="emit('input', $event)"
      @blur="emit('blur')"
    >
    <button
      type="button"
      class="sft-password-toggle"
      :data-testid="dataTestid ? `${dataTestid}-toggle` : undefined"
      :aria-label="showPassword ? hidePasswordAriaLabel : showPasswordAriaLabel"
      @click="showPassword = !showPassword"
    >
      <StarterIcon :name="showPassword ? 'eyeOff' : 'eye'" />
    </button>
  </div>
</template>
