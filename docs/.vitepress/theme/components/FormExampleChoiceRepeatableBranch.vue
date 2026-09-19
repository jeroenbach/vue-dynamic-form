<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ChoiceRepeatableBranchValues {
  notifications?: {
    phoneNumbers?: string[]
    email?: string
  }
}

const { values, meta } = useDynamicForm<ChoiceRepeatableBranchValues>();

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'notifications',
    type: 'heading',
    fieldOptions: { label: 'Notification channel' },
    description: 'Pick exactly one channel. The SMS branch itself repeats: once selected, you can add up to 3 phone numbers for that single selection.',
    explicitChoiceSelection: true,
    choiceShowChoiceSelect: true,
    choice: [
      {
        name: 'phoneNumbers',
        type: 'text',
        maxOccurs: 3,
        fullWidth: true,
        fieldOptions: { label: 'SMS' },
        description: 'Up to 3 phone numbers.',
        placeholder: 'e.g. +31 6 12345678',
      },
      {
        name: 'email',
        type: 'text',
        fieldOptions: { label: 'Email' },
        description: 'A single address.',
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
