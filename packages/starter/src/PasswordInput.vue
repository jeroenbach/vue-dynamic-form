<script lang="ts" setup>
import { ref } from 'vue';
import StarterIcon from '@/StarterIcon.vue';

export interface Props {
  id?: string
  value?: string | unknown
  placeholder?: string
  disabled?: boolean
  errorMessage?: string
  dataTestid?: string
}

defineProps<Props>();
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
      tabindex="-1"
      class="sft-password-toggle"
      :data-testid="dataTestid ? `${dataTestid}-toggle` : undefined"
      :aria-label="showPassword ? 'Hide password' : 'Show password'"
      @click="showPassword = !showPassword"
    >
      <StarterIcon :name="showPassword ? 'eyeOff' : 'eye'" />
    </button>
  </div>
</template>
