<script setup lang="ts">
import type { Metadata } from './AdvancedForm.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ValidationPasswordValues {
  password?: string
}

const { values, meta } = useDynamicForm<ValidationPasswordValues>();

// #region password-validation
function validatePassword(value: unknown): true | string {
  const str = String(value ?? '');
  if (!str)
    return true;
  const missing: string[] = [];
  if (str.length < 8)
    missing.push('8+ characters');
  if (!/[A-Z]/.test(str))
    missing.push('uppercase letter');
  if (!/[a-z]/.test(str))
    missing.push('lowercase letter');
  if (!/\d/.test(str))
    missing.push('number');
  if (!/[^A-Z0-9]/i.test(str))
    missing.push('special character');
  return missing.length === 0 ? true : `Needs: ${missing.join(', ')}`;
}
// #endregion password-validation

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'password',
    type: 'password',
    password: { showStrengthBar: true },
    fieldOptions: { label: 'Password' },
    description: 'Must contain 8+ characters, uppercase, lowercase, a number and a special character.',
    validation: validatePassword,
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
