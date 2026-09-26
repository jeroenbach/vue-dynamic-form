<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface PreserveOnSwitchValues {
  shipping?: {
    homeDelivery?: { street?: string, city?: string }
    pickupPoint?: { pointId?: string }
  }
}

const { values, meta } = useDynamicForm<PreserveOnSwitchValues>();

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'shipping',
    type: 'heading',
    fieldOptions: { label: 'Shipping' },
    description: 'Fill in an address, switch to pickup, then switch back: your address is still there.',
    explicitChoiceSelection: true,
    preserveOnSwitch: true,
    choiceShowChoiceSelect: true,
    choice: [
      {
        name: 'homeDelivery',
        fieldOptions: { label: 'Home delivery' },
        description: 'We deliver to your door.',
        children: [
          { name: 'street', type: 'text', fieldOptions: { label: 'Street' } },
          { name: 'city', type: 'text', fieldOptions: { label: 'City' } },
        ],
      },
      {
        name: 'pickupPoint',
        fieldOptions: { label: 'Pickup point' },
        description: 'Collect it nearby.',
        children: [
          { name: 'pointId', type: 'text', fieldOptions: { label: 'Pickup point code' } },
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
