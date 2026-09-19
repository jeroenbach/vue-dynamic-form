<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ExplicitChoiceRepeatableValues {
  integrations?: {
    crmExport?: { crmSystem?: string, exportSchedule?: string }[]
    apiEndpoint?: { url?: string, apiKey?: string }[]
  }
}

const { values, meta } = useDynamicForm<ExplicitChoiceRepeatableValues>();

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'integrations',
    type: 'heading',
    fieldOptions: { label: 'Integrations to add' },
    description: 'Add up to 5 integrations in any mix. Each kind has its own limit of 3, so its Add button disables independently.',
    maxOccurs: 5,
    explicitChoiceSelection: true,
    choiceShowChoiceSelect: true,
    choice: [
      {
        name: 'crmExport',
        maxOccurs: 3,
        fullWidth: true,
        fieldOptions: { label: 'CRM export' },
        children: [
          { name: 'crmSystem', type: 'text', fieldOptions: { label: 'CRM system' }, placeholder: 'e.g. Salesforce' },
          { name: 'exportSchedule', type: 'text', fieldOptions: { label: 'Export schedule' }, placeholder: 'e.g. nightly' },
        ],
      },
      {
        name: 'apiEndpoint',
        maxOccurs: 3,
        fullWidth: true,
        fieldOptions: { label: 'API endpoint' },
        children: [
          { name: 'url', type: 'text', fieldOptions: { label: 'Endpoint URL' }, placeholder: 'https://example.com/webhook' },
          { name: 'apiKey', type: 'text', fieldOptions: { label: 'API key' } },
        ],
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
