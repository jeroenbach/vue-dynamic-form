<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import type { Props as ReviewGroupProps } from './ReviewGroup.vue';
import { removeNullValues, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { computed, ref } from 'vue';
import AdvancedForm from './AdvancedForm.vue';
import SubmissionSuccess from './SubmissionSuccess.vue';

// #region shared-types
export interface EventRegistrationValues {
  attendee?: {
    fullName?: string
    email?: string
  }
  ticket?: {
    ticketType?: string
    quantity?: string
  }
  preferences?: {
    dietary?: string
    newsletter?: boolean
  }
}
// #endregion shared-types

// #region local-state
const { values, meta, handleSubmit, resetForm } = useDynamicForm<EventRegistrationValues>();

const formName = 'Event Registration';
const submitted = ref<EventRegistrationValues | undefined>(undefined);

const ticketOptions = [
  { key: 'standard', value: 'Standard' },
  { key: 'workshop', value: 'Workshop pass' },
  { key: 'vip', value: 'VIP' },
];

const dietaryOptions = [
  { key: 'none', value: 'No restrictions' },
  { key: 'vegetarian', value: 'Vegetarian' },
  { key: 'vegan', value: 'Vegan' },
  { key: 'glutenFree', value: 'Gluten free' },
];

const ticketLabel = computed(() =>
  ticketOptions.find(o => o.key === values?.ticket?.ticketType)?.value,
);
const dietaryLabel = computed(() =>
  dietaryOptions.find(o => o.key === values?.preferences?.dietary)?.value,
);
// #endregion local-state

// #region summary-information
const wizardSummary = computed<ReviewGroupProps[]>(() => [
  {
    title: 'Attendee',
    rows: [
      ['Full name', values?.attendee?.fullName || '—'],
      ['Email', values?.attendee?.email || '—'],
    ],
  },
  {
    title: 'Ticket',
    rows: [
      ['Type', ticketLabel.value || '—'],
      ['Quantity', values?.ticket?.quantity || '—'],
    ],
  },
  {
    title: 'Preferences',
    rows: [
      ['Dietary', dietaryLabel.value || '—'],
      ['Newsletter', values?.preferences?.newsletter ? 'Subscribed' : 'No'],
    ],
  },
]);
// #endregion summary-information

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'registration',
    path: '',
    wizard: true,
    fieldOptions: { label: formName },
    description: 'Reserve your spot',
    submitButtonText: 'Complete registration',
    children: [
      {
        name: 'attendee',
        type: 'heading',
        fieldOptions: { label: 'Attendee' },
        description: 'Who is attending?',
        helpText: 'Your details',
        children: [
          {
            name: 'fullName',
            fieldOptions: { label: 'Full name' },
            restriction: { minLength: 2 },
            fullWidth: true,
          },
          {
            name: 'email',
            fieldOptions: { label: 'Email' },
            restriction: { pattern: '^.+@.+\\..+$' },
            fullWidth: true,
          },
        ],
      },
      {
        name: 'ticket',
        type: 'heading',
        fieldOptions: { label: 'Ticket' },
        description: 'Choose what you are booking.',
        helpText: 'Pick a ticket',
        children: [
          {
            name: 'ticketType',
            type: 'select',
            fieldOptions: { label: 'Ticket type' },
            options: ticketOptions,
          },
          {
            name: 'quantity',
            type: 'select',
            fieldOptions: { label: 'Quantity' },
            options: [
              { key: '1', value: '1' },
              { key: '2', value: '2' },
              { key: '3', value: '3' },
            ],
          },
        ],
      },
      {
        name: 'preferences',
        type: 'heading',
        fieldOptions: { label: 'Preferences' },
        description: 'Optional extras, skip anything that does not apply.',
        helpText: 'Fine-tune',
        children: [
          {
            name: 'dietary',
            type: 'select',
            minOccurs: 0,
            fieldOptions: { label: 'Dietary requirements' },
            options: dietaryOptions,
          },
          {
            name: 'newsletter',
            type: 'checkbox',
            minOccurs: 0,
            fieldOptions: { label: 'Send me event updates by email' },
            fullWidth: true,
          },
        ],
      },
      {
        name: 'summaryPage',
        type: 'wizardSummaryPage',
        fieldOptions: { label: 'Review & submit' },
        description: 'Check everything before you register. Jump back to any step to make a change.',
        helpText: 'Confirm',
        minOccurs: 0,
        computedProps: [(field) => { field.wizardSummary = wizardSummary.value; }],
      },
    ],
  },
];
// #endregion metadata

// #region submit
function reset() {
  resetForm();
  submitted.value = undefined;
}

// The wizard's last-page button is a native type="submit" control, so AdvancedForm forwards the
// form's own submit event here for handleSubmit to take over.
function onSubmit(event?: Event) {
  handleSubmit(
    (values) => {
      submitted.value = removeNullValues(values);
    },
    () => {},
  )(event);
}
// #endregion submit
</script>

<template>
  <div class="form-demo flex flex-col gap-6 max-w-3xl mx-auto">
    <AdvancedForm v-if="!submitted" :metadata @submit="onSubmit" />
    <SubmissionSuccess
      v-else
      :title="`You're registered, ${values.attendee?.fullName}`"
      referenceCode="EVT-20260615-K2QP"
      :submittedJson="JSON.stringify(submitted, null, 2)"
      @reset="reset"
    />

    <pre
      v-if="!submitted"
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
