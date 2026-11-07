<script setup lang="ts">
import type { Metadata } from './AdvancedForm.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ValidationWebsiteValues {
  website?: string
}

const { values, meta } = useDynamicForm<ValidationWebsiteValues>();

// #region website-validation
function validateWebsite(value: unknown): true | string {
  if (!value)
    return true;
  try {
    const url = new URL(String(value));
    return (url.protocol === 'https:' || url.protocol === 'http:') || 'Must be a valid URL';
  }
  catch {
    return 'Must be a valid URL (e.g. https://example.com)';
  }
}
// #endregion website-validation

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'website',
    minOccurs: 0,
    fieldOptions: { label: 'Website' },
    description: 'Optional. Validated with a custom function: must be a valid http(s) URL.',
    placeholder: 'https://example.com',
    validation: validateWebsite,
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
