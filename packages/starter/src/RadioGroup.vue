<script lang="ts" setup>
export interface RadioOption {
  key: string
  value: string
}

export interface Props {
  // Sourced from the field path, the same way TextInput/SelectInput/PasswordInput receive it.
  // Applied to the first option's native id (so the field label associates with a real
  // element) and to every option's native name (so the browser groups them for single
  // selection and arrow-key navigation). One prop, two jobs.
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
    role="radiogroup"
    :data-testid="dataTestid"
    class="sft-radio-group"
    :class="{ 'is-invalid': !!errorMessage }"
    :aria-invalid="!!errorMessage"
  >
    <label
      v-for="(option, index) in options"
      :key="option.key"
      class="sft-radio-option"
      :class="{ 'is-selected': value === option.key, 'is-disabled': disabled }"
    >
      <input
        :id="index === 0 ? id : undefined"
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
