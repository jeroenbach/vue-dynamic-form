<script setup lang="ts">
const { checked = false, label = '', disabled = false, falseAsUndefined = false } = defineProps<{
  checked?: boolean
  label?: string
  disabled?: boolean
  falseAsUndefined?: boolean
}>();
const emit = defineEmits<{
  'update:checked': [value: boolean | undefined]
  'change': [value: boolean | undefined]
  'blur': [event: FocusEvent]
}>();

function onChange(event: Event) {
  const falseOrUndefined = falseAsUndefined ? undefined : false;
  const value = (event.target as HTMLInputElement).checked ? true : falseOrUndefined;
  emit('update:checked', value);
  emit('change', value);
}

function onBlur(event: FocusEvent) {
  emit('blur', event);
}
</script>

<template>
  <label
    class="relative inline-flex shrink-0 items-center"
    :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
  >
    <input
      type="checkbox"
      class="peer sr-only"
      :checked="checked"
      :disabled="disabled"
      :aria-label="label"
      @change="onChange"
      @blur="onBlur"
    >
    <div
      class="h-6 w-11 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors peer-checked:bg-sky-600 peer-focus-visible:outline peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-500"
    />
    <div
      class="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white dark:bg-slate-200 shadow transition-transform peer-checked:translate-x-5"
    />
  </label>
</template>
