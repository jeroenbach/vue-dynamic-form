<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ExplicitChoiceSingleValues {
  contactMethod?: {
    email?: string
    phone?: string
  }
}

const { values, meta } = useDynamicForm<ExplicitChoiceSingleValues>();

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'contactMethod',
    type: 'heading',
    fieldOptions: { label: 'Preferred contact' },
    description: 'Nothing renders until you pick a method. Picking the other one afterwards clears what you filled in.',
    explicitChoiceSelection: true,
    choiceShowChoiceSelect: true,
    choice: [
      {
        name: 'email',
        type: 'text',
        fieldOptions: { label: 'Email address' },
        description: 'We reply within one business day.',
      },
      {
        name: 'phone',
        type: 'text',
        fieldOptions: { label: 'Phone number' },
        description: 'We call during office hours.',
      },
    ],
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
