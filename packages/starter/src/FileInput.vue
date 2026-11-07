<script lang="ts" setup>
import { ref, watch } from 'vue';

export interface Props {
  id?: string
  value?: File
  accept?: string
  disabled?: boolean
  errorMessage?: string
  /** Aria label of the clear button; `{name}` is the chosen filename. Defaults to "Remove {name}". */
  clearAriaLabel?: string
  // Explicit props rather than attrs fallthrough: attrs would land on the wrapper div, and
  // these two must sit on the native input for a screen reader to pick them up on focus.
  ariaLabelledby?: string
  ariaDescribedby?: string
  dataTestid?: string
}

const props = defineProps<Props>();
const emit = defineEmits<{
  change: [file: File | undefined]
  blur: [event: FocusEvent]
}>();

const nativeInput = ref<HTMLInputElement>();

// The clear button unmounts itself when clicked (it only renders while a file is held), which
// would silently drop keyboard focus to the page body. Handing focus to the native input keeps
// the user inside the field, ready to pick a new file.
function clear(): void {
  emit('change', undefined);
  nativeInput.value?.focus();
}

// The native element's own value can never be data-bound. Whenever the model drops to
// undefined, whether that came from our own clear button or an outside reset, the native
// value has to be cleared by hand so the same file can be picked again right away.
watch(() => props.value, (value) => {
  if (!value && nativeInput.value)
    nativeInput.value.value = '';
});
</script>

<template>
  <div class="sft-file" :class="{ 'is-invalid': !!errorMessage, 'is-disabled': disabled }" :data-testid="dataTestid">
    <label class="sft-btn sft-btn-default sft-file-trigger">
      {{ value ? 'Change file' : 'Choose file' }}
      <input
        :id="id"
        ref="nativeInput"
        type="file"
        class="sft-file-native"
        :accept="accept"
        :disabled="disabled"
        :aria-invalid="!!errorMessage"
        :aria-labelledby="ariaLabelledby"
        :aria-describedby="ariaDescribedby"
        @change="$emit('change', ($event.target as HTMLInputElement).files?.[0])"
        @blur="$emit('blur', $event)"
      >
    </label>
    <span class="sft-file-name" :class="{ 'is-empty': !value }">{{ value?.name ?? 'No file chosen' }}</span>
    <button
      v-if="value"
      type="button"
      class="sft-file-clear"
      :aria-label="(clearAriaLabel ?? 'Remove {name}').replace('{name}', value.name)"
      @click="clear"
    >
      &times;
    </button>
  </div>
</template>
