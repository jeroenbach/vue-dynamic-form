<script lang="ts" setup>
import { computed } from 'vue';

export interface Props {
  id?: string
  /** Base testid: the textarea gets `<dataTestid>-input`, the counter `<dataTestid>-char-count`. */
  dataTestid?: string
  value?: string
  disabled?: boolean
  placeholder?: string
  errorMessage?: string
  /** The limit the counter reads out; the actual enforcement is the field's own validation. */
  maxLength?: number
}

const props = defineProps<Props>();

defineEmits<{
  input: [event: Event]
  blur: [event: FocusEvent]
}>();

const charCount = computed(() => props.value?.length ?? 0);
const isOverLimit = computed(() => props.maxLength !== undefined && charCount.value > props.maxLength);
</script>

<template>
  <textarea
    :id="id"
    :data-testid="dataTestid ? `${dataTestid}-input` : undefined"
    :value="value"
    :disabled="disabled"
    :placeholder="placeholder"
    :aria-invalid="!!errorMessage"
    class="min-h-[76px] w-full resize-y rounded-lg border bg-white dark:bg-slate-900 !px-3 !py-2 md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400"
    :class="{
      'border-gray-200 focus:border-sky-500 focus:ring-sky-200': !errorMessage,
      'border-red-500 dark:border-rose-600 focus:border-red-500 dark:focus:border-rose-500 focus:ring-red-200 dark:focus:ring-rose-900': errorMessage,
    }"
    @input="$emit('input', $event)"
    @blur="$emit('blur', $event)"
  />
  <div
    class="mt-1 text-right text-xs text-slate-500 dark:text-slate-400"
    :class="{ 'text-red-600 dark:text-rose-400 font-semibold': isOverLimit }"
    :data-testid="dataTestid ? `${dataTestid}-char-count` : undefined"
    :data-exceeds-limit="isOverLimit"
  >
    {{ charCount }} / {{ maxLength ?? 0 }}
  </div>
</template>
