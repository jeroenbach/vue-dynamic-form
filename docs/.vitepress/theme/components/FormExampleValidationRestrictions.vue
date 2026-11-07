<script setup lang="ts">
import type { Metadata } from './AdvancedForm.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ValidationRestrictionsValues {
  username?: string
  displayName?: string
  bio?: string
  amount?: string
  promoCode?: string
}

const { values, meta } = useDynamicForm<ValidationRestrictionsValues>();

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'username',
    fieldOptions: { label: 'Username' },
    description: 'Letters, numbers and underscores only. 3-20 characters.',
    restriction: {
      minLength: 3,
      maxLength: 20,
      pattern: '^[a-zA-Z0-9_]+$',
    },
  },
  {
    name: 'displayName',
    fieldOptions: { label: 'Display name' },
    description: 'Leading/trailing spaces and repeated whitespace are rejected via the whiteSpace: collapse restriction.',
    restriction: {
      minLength: 2,
      maxLength: 50,
      whiteSpace: 'collapse',
    },
  },
  {
    name: 'bio',
    minOccurs: 0,
    fieldOptions: { label: 'Bio' },
    description: 'Optional. Max 200 characters.',
    restriction: { maxLength: 200 },
  },
  {
    name: 'amount',
    fieldOptions: { label: 'Amount (USD)' },
    description: 'Must be greater than 0, at most $10,000, and no more than 2 decimal places.',
    placeholder: '0.00',
    restriction: {
      minExclusive: 0,
      maxInclusive: 10000,
      fractionDigits: 2,
    },
  },
  {
    name: 'promoCode',
    minOccurs: 0,
    fieldOptions: { label: 'Promo code' },
    description: 'Optional. Must be 4-8 uppercase letters or digits (e.g. SAVE2025).',
    placeholder: 'SAVE2025',
    restriction: { pattern: '^[A-Z0-9]{4,8}$' },
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
