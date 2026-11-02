<script setup lang="ts">
const { checked = false, label = '', disabled = false, falseAsUndefined = false, dataTestid } = defineProps<{
  checked?: boolean
  label?: string
  disabled?: boolean
  falseAsUndefined?: boolean
  dataTestid?: string
}>();
const emit = defineEmits<{
  'update:checked': [value: boolean | undefined]
  'change': [value: boolean | undefined]
  'blur': [event: FocusEvent]
}>();

function toggle() {
  if (disabled)
    return;
  const falseOrUndefined = falseAsUndefined ? undefined : false;
  const value = checked ? falseOrUndefined : true;
  emit('update:checked', value);
  emit('change', value);
}

function onBlur(event: FocusEvent) {
  emit('blur', event);
}
</script>

<template>
  <span
    :data-testid="dataTestid"
    class="sft-switch"
    :class="{ 'is-on': checked, 'is-disabled': disabled }"
    role="switch"
    :tabindex="disabled ? -1 : 0"
    :aria-checked="!!checked"
    :aria-label="label || undefined"
    :aria-disabled="disabled || undefined"
    @click="toggle"
    @keydown.space.prevent="toggle"
    @keydown.enter.prevent="toggle"
    @blur="onBlur"
  >
    <span class="sft-switch-track" />
    <span class="sft-switch-thumb" />
  </span>
</template>
