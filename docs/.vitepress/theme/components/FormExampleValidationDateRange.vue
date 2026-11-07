<script setup lang="ts">
import type { Metadata } from './AdvancedForm.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ValidationDateRangeValues {
  startDate?: string
  endDate?: string
}

// #region example
const { values, meta, useFieldValue, validateField } = useDynamicForm<ValidationDateRangeValues>();

const startDateValue = useFieldValue('startDate');

const metadata: Metadata[] = [
  {
    name: 'startDate',
    fieldOptions: { label: 'Start date' },
    placeholder: 'YYYY-MM-DD',
    restriction: { pattern: String.raw`^\d{4}-\d{2}-\d{2}$` },
  },
  {
    name: 'endDate',
    fieldOptions: { label: 'End date' },
    placeholder: 'YYYY-MM-DD',
    restriction: { pattern: String.raw`^\d{4}-\d{2}-\d{2}$` },
    validation: (value: unknown) => {
      const start = startDateValue.value;
      if (!value || !start)
        return true;
      return String(value) > String(start) || 'End date must be after start date';
    },
    computedProps: [
      (_, fieldValue) => {
        if (startDateValue.value && fieldValue.value)
          validateField('endDate');
      },
    ],
  },
];
// #endregion example
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
