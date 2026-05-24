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
    name: 'systems',
    type: 'heading',
    fieldOptions: { label: 'Systems to connect' },
    description: `Any external tools we'll integrate with during onboarding.`,
    helpText: 'What needs to connect?',
    // #region array-field-options
    arrayNoItemsMessage: `Skip this step if there's nothing to integrate.`,
    arrayItemName: 'system',
    arrayItemNamePlural: 'systems',
    arrayItemFieldForTitle: 'systemName',
    minOccurs: 0,
    maxOccurs: 4,
    autoAddMinOccurs: false,
    // #endregion array-field-options
    fullWidth: true,
    children: [
      {
        name: 'systemName',
        fieldOptions: { label: 'System name' },
        placeholder: 'e.g. Salesforce, HubSpot',
      },
      {
        name: 'purpose',
        fieldOptions: { label: 'Purpose in the rollout' },
        placeholder: 'e.g. source of CRM records',
      },
    ],
  },
];
// #endregion metadata
</script>

<template>
  <div class="form-demo flex flex-col gap-6 max-w-3xl mx-auto">
    <AdvancedForm :metadata />
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
