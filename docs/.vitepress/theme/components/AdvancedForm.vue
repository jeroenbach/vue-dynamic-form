<script setup lang="ts">
import type { DynamicFormSettings, FieldMetadata } from '@bach.software/vue-dynamic-form';
import { DynamicForm } from '@bach.software/vue-dynamic-form';
import { computed } from 'vue';
import AdvancedFormTemplate from './AdvancedFormTemplate.vue';

export interface Props {
  metadata: FieldMetadata[]
  settings?: DynamicFormSettings
}

const { metadata, settings: _settings } = defineProps<Props>();

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
  <form class="space-y-6">
    <DynamicForm
      :template="AdvancedFormTemplate"
      :metadata="metadata"
      :settings
    />
  </form>
</template>
