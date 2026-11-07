<script lang="ts" setup>
export interface RadioOption {
  key: string
  value: string
}

export interface Props {
  // Sourced from the field path, the same way TextInput/SelectInput/PasswordInput receive it.
  // Applied to the group element's own id and to every option's native name (so the browser
  // groups them for single selection and arrow-key navigation). It is never an option's id:
  // each radio already has its wrapping option label, and a field-level `label for` pointing
  // at one of them would give that radio two labels. The field label names the whole group
  // through aria-labelledby instead (passed through by the template as a plain attribute).
  id?: string
  value?: string
  options?: RadioOption[]
  disabled?: boolean
  errorMessage?: string
  dataTestid?: string
}

withDefaults(defineProps<Props>(), {
  options: () => [],
});

defineEmits<{
  change: [key: string]
  blur: [event: FocusEvent]
}>();
</script>

<template>
  <div
    :id="id"
    role="radiogroup"
    :data-testid="dataTestid"
    class="sft-radio-group"
    :class="{ 'is-invalid': !!errorMessage }"
    :aria-invalid="!!errorMessage"
  >
    <label
      v-for="option in options"
      :key="option.key"
      class="sft-radio-option"
      :class="{ 'is-selected': value === option.key, 'is-disabled': disabled }"
    >
      <input
        type="radio"
        class="sft-radio-input"
        :name="id"
        :checked="value === option.key"
        :disabled="disabled"
        @change="$emit('change', option.key)"
        @blur="$emit('blur', $event)"
      >
      <span class="sft-radio-control">
        <span class="sft-radio-dot" />
      </span>
      <span class="sft-radio-label">{{ option.value }}</span>
    </label>
  </div>
</template>
