<script setup lang="ts">
import type { Metadata } from './BasicFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import BasicForm from './BasicForm.vue';

const { values, meta } = useDynamicForm();

const metadata: Metadata[] = [
  {
    fieldOptions: { label: 'Field 1' },
  },
  {
    fieldOptions: { label: 'Field 2' },
  },
];
</script>

<template>
  <div class="form-demo flex flex-col gap-2">
    <BasicForm :metadata />
    <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
IsDirty: {{ meta.dirty }}
Touched: {{ meta.touched }}
Valid: {{ meta.valid }}

// form values:
{{ JSON.stringify(values, null, 2) }}
    </pre>
  </div>
</template>
