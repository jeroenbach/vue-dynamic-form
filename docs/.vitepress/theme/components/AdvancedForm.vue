<script setup lang="ts">
import type { StarterDynamicFormSettings, StarterMetadata } from '@bach.software/vue-dynamic-form-starter';
import { DynamicForm } from '@bach.software/vue-dynamic-form';
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import { computed } from 'vue';

export type Metadata = StarterMetadata;

export type DynamicFormSettings = StarterDynamicFormSettings;

export interface Props {
  metadata: Metadata[]
  settings?: DynamicFormSettings
}

export interface Emits {
  /** Forwarded from the native form submit event. Wire this to your own `handleSubmit(...)` from `useDynamicForm`. */
  (e: 'submit', event?: Event): void
}

const { metadata, settings: _settings } = defineProps<Props>();
const emit = defineEmits<Emits>();

const settings = computed<DynamicFormSettings>(() => ({
  // Recommended pattern: don't show an error until the user leaves the field, then keep
  // validating live so a correction clears the error without another blur.
  validateOnValueUpdate: false,
  validateOnBlur: true,
  messages: {
    required: '{field} is required',
    minOccurs: 'At least {min} items required',
    choiceMinOccurs: 'The following fields need to occur at least {min} time(s): {field}',
    minLength: 'The minimum length of {field} is {length}',
    maxLength: 'The maximum length of {field} is {length}',
    length: '{field} must be exactly {length} characters',
    pattern: '{field} does not match the required pattern',
    minInclusive: '{field} must be at least {min}',
    maxInclusive: '{field} must be at most {max}',
    minExclusive: '{field} must be greater than {min}',
    maxExclusive: '{field} must be less than {max}',
    enumeration: '{field} must be one of the allowed values',
    whiteSpace: '{field} contains invalid whitespace (mode: {mode})',
    fractionDigits: '{field} may have at most {digits} decimal place(s)',
    totalDigits: '{field} may have at most {digits} significant digit(s)',
  },
  ...(_settings ?? {}),
}));
</script>

<template>
  <form novalidate @submit.prevent="emit('submit', $event)">
    <DynamicForm
      :template="StarterFormTemplate"
      :metadata="metadata"
      :settings
    />
  </form>
</template>
