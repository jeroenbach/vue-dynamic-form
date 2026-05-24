<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

// #region shared-types
export interface DynamicFieldsValues {
  systems?: {
    systemName?: string
    purpose?: string
  }[]
}
// #endregion shared-types

// #region local-state
const { values, meta } = useDynamicForm<DynamicFieldsValues>();
// #endregion local-state

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'payment',
    type: 'heading',
    fieldOptions: { label: 'Payment method' },
    // #region choice-structure
    choice: [
      {
        name: 'card',
        fieldOptions: { label: 'Credit / debit card' },
        children: [
          { name: 'number', type: 'text', fieldOptions: { label: 'Card number' } },
          { name: 'cvv', type: 'text', fieldOptions: { label: 'CVV' } },
        ],
      },
      {
        name: 'transfer',
        fieldOptions: { label: 'Bank transfer' },
        children: [
          { name: 'iban', type: 'text', fieldOptions: { label: 'IBAN' } },
        ],
      },
    ],
    // #endregion choice-structure
  },
];
// #endregion metadata
</script>

<template>
  <div class="form-demo flex flex-col gap-6 max-w-3xl mx-auto">
    <AdvancedForm :metadata :settings="{ showRequiredOrOptional: 'required' }" />
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
