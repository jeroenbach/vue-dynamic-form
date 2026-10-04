<script setup lang="ts">
import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';
import type { starterMetadata } from '@bach.software/vue-dynamic-form-starter';
import type { DefineComponent } from 'vue';
import { DynamicForm } from '@bach.software/vue-dynamic-form';
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import { computed } from 'vue';

export type Metadata = GetMetadataType<typeof starterMetadata>;

export type DynamicFormSettings = GetDynamicFormSettingsType<typeof starterMetadata>;

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

// `StarterFormTemplate` is generic, which `vue-tsc` does not accept for the `template` prop as is.
const template = StarterFormTemplate as unknown as DefineComponent<object, object, any>;

const settings = computed<DynamicFormSettings>(() => ({
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
  <form @submit="emit('submit', $event)">
    <DynamicForm
      :template="template"
      :metadata="metadata"
      :settings
    />
  </form>
</template>
