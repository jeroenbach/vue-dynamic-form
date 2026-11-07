<script setup lang="ts">
import type { Metadata } from './AdvancedForm.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ValidationAsyncValues {
  email?: string
}

const { values, meta } = useDynamicForm<ValidationAsyncValues>();

// #region async-validation
const takenEmails = new Set(['admin@example.com', 'test@test.com', 'hello@world.com']);

async function validateEmailAvailability(value: unknown): Promise<true | string> {
  if (!value)
    return true;
  await new Promise(resolve => setTimeout(resolve, 700));
  return takenEmails.has(String(value).toLowerCase())
    ? `${value} is already registered`
    : true;
}
// #endregion async-validation

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'email',
    fieldOptions: { label: 'Email' },
    description: 'Format is checked with a restriction. Availability is verified asynchronously (try admin@example.com).',
    restriction: { pattern: String.raw`^.+@.+\..+$` },
    validation: validateEmailAvailability,
  },
];
// #endregion metadata
</script>

<template>
  <div class="form-demo flex flex-col gap-6 max-w-3xl mx-auto">
    <AdvancedForm :metadata class="flex flex-col gap-6" />
    <pre
      class="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg text-sm overflow-auto"
    >
IsDirty: {{ meta.dirty }}
Touched: {{ meta.touched }}
Valid: {{ meta.valid }}

// form values:
{{ JSON.stringify(values, null, 2) }}
    </pre>
  </div>
</template>
