<script setup lang="ts">
import type { Metadata } from './AdvancedForm.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ValidationConfirmPasswordValues {
  password?: string
  confirmPassword?: string
}

// #region example
const { values, meta, useFieldValue, validateField } = useDynamicForm<ValidationConfirmPasswordValues>();

const passwordValue = useFieldValue('password');

const metadata: Metadata[] = [
  {
    name: 'password',
    type: 'password',
    password: { showStrengthBar: false },
    fieldOptions: { label: 'Password' },
  },
  {
    name: 'confirmPassword',
    type: 'password',
    password: { showStrengthBar: false },
    fieldOptions: { label: 'Confirm password' },
    description: 'Re-validated automatically whenever the password field changes.',
    validation: (value: unknown) => {
      if (!value)
        return true;
      const pwd = passwordValue.value;
      return value === pwd || 'Passwords do not match';
    },
    computedProps: [
      (_, fieldValue) => {
        if (passwordValue.value && fieldValue.value)
          validateField('confirmPassword');
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
