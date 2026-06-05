<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ValidationFormValues {
  account?: {
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
  }
  profile?: {
    displayName?: string
    bio?: string
  }
  dateRange?: {
    startDate?: string
    endDate?: string
  }
  billing?: {
    amount?: string
    promoCode?: string
  }
}

const { values, meta, useFieldValue, validateField } = useDynamicForm<ValidationFormValues>();

const passwordValue = useFieldValue('account.password');
const startDateValue = useFieldValue('dateRange.startDate');

// #region async-validation
const takenEmails = ['admin@example.com', 'test@test.com', 'hello@world.com'];

async function validateEmailAvailability(value: unknown): Promise<true | string> {
  if (!value) return true;
  await new Promise(resolve => setTimeout(resolve, 700));
  return takenEmails.includes(String(value).toLowerCase())
    ? `${value} is already registered`
    : true;
}
// #endregion async-validation

// #region password-validation
function validatePassword(value: unknown): true | string {
  const str = String(value ?? '');
  if (!str) return true;
  const missing: string[] = [];
  if (str.length < 8) missing.push('8+ characters');
  if (!/[A-Z]/.test(str)) missing.push('uppercase letter');
  if (!/[a-z]/.test(str)) missing.push('lowercase letter');
  if (!/[0-9]/.test(str)) missing.push('number');
  if (!/[^A-Za-z0-9]/.test(str)) missing.push('special character');
  return missing.length === 0 ? true : `Needs: ${missing.join(', ')}`;
}
// #endregion password-validation

// #region website-validation
function validateWebsite(value: unknown): true | string {
  if (!value) return true;
  try {
    const url = new URL(String(value));
    return (url.protocol === 'https:' || url.protocol === 'http:') || 'Must be a valid URL';
  }
  catch {
    return 'Must be a valid URL (e.g. https://example.com)';
  }
}
// #endregion website-validation

// #region metadata
const metadata: Metadata[] = [
  // ─── Account details ────────────────────────────────────────────────────────
  {
    name: 'account',
    type: 'heading',
    fieldOptions: { label: 'Account details' },
    description: 'Combines restriction-based rules with custom and async validation.',
    children: [
      // #region restriction-example
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
      // #endregion restriction-example
      {
        name: 'email',
        fieldOptions: { label: 'Email' },
        description: 'Format is checked with a restriction. Availability is verified asynchronously — try admin@example.com.',
        restriction: { pattern: '^.+@.+\\..+$' },
        validation: validateEmailAvailability,
      },
      {
        name: 'password',
        type: 'password',
        showStrengthBar: true,
        fieldOptions: { label: 'Password' },
        description: 'Must contain 8+ characters, uppercase, lowercase, a number and a special character.',
        validation: validatePassword,
      },
      // #region cross-field-password
      {
        name: 'confirmPassword',
        type: 'password',
        showStrengthBar: false,
        fieldOptions: { label: 'Confirm password' },
        description: 'Re-validated automatically whenever the password field changes.',
        validation: (value: unknown) => {
            if (!value) return true;
            const pwd = passwordValue.value;
            return value === pwd || 'Passwords do not match';
        },
        computedProps: [
          (_, fieldValue) => {
            if (passwordValue.value && fieldValue.value)
              validateField('account.confirmPassword')
          }
        ]
      },
      // #endregion cross-field-password
    ],
  },

  // ─── Profile ────────────────────────────────────────────────────────────────
  {
    name: 'profile',
    type: 'heading',
    fieldOptions: { label: 'Profile' },
    description: 'Whitespace and length restrictions keep data clean without writing a single validation function.',
    children: [
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
        name: 'website',
        minOccurs: 0,
        fieldOptions: { label: 'Website' },
        description: 'Optional. Validated with a custom function — must be a valid http(s) URL.',
        placeholder: 'https://example.com',
        validation: validateWebsite,
      },
    ],
  },

  // ─── Date range (cross-field) ────────────────────────────────────────────────
  {
    name: 'dateRange',
    type: 'heading',
    fieldOptions: { label: 'Date range' },
    description: 'End date is validated against the start date. computedProps re-triggers validation on endDate whenever startDate changes.',
    children: [
      {
        name: 'startDate',
        fieldOptions: { label: 'Start date' },
        placeholder: 'YYYY-MM-DD',
        restriction: { pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      },
      // #region cross-field-date
      {
        name: 'endDate',
        fieldOptions: { label: 'End date' },
        placeholder: 'YYYY-MM-DD',
        restriction: { pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        validation: (value: unknown) => {
            const start = startDateValue.value;
            if (!value || !start) return true;
            return String(value) > String(start) || 'End date must be after start date';
        },
        computedProps: [
          (_, fieldValue) => {
            if (startDateValue.value && fieldValue.value)
              validateField('dateRange.endDate')
          }
        ]
      },
      // #endregion cross-field-date
    ],
  },

  // ─── Billing ────────────────────────────────────────────────────────────────
  {
    name: 'billing',
    type: 'heading',
    fieldOptions: { label: 'Billing' },
    description: 'Numeric and format restrictions — no custom code needed.',
    children: [
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
    ],
  },
];
// #endregion metadata
</script>

<template>
  <div class="form-demo flex flex-col gap-6 max-w-3xl mx-auto">
    <AdvancedForm :metadata class="flex flex-col gap-6"/>
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
