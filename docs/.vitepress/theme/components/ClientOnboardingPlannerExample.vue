<!-- #region client-onboarding-planner-example -->
<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import { computed, onMounted } from 'vue';
import AdvancedForm from './AdvancedForm.vue';

// #region shared-types
export interface SelectOption {
  key: string
  value: string
}

export interface OptionStore {
  industry: SelectOption[]
  teamSize: SelectOption[]
  role: SelectOption[]
  trainingFormat: SelectOption[]
}

export type OptionName = keyof OptionStore;

export interface LoadOptionsParams {
  industry?: string
}

export interface ClientOnboardingPlannerValues {
  clientOnboarding?: {
    company?: {
      companyName?: string
      industry?: string
      teamSize?: string
      requiresMigration?: boolean
      migrationDeadline?: string
    }
    projectContacts?: {
      fullName?: string
      email?: string
      role?: string
    }[]
    launchApproach?: {
      selfServe?: {
        goLiveDate?: string
        internalOwner?: string
      }
      guidedRollout?: {
        kickoffDate?: string
        needsTraining?: boolean
        trainingFormat?: string
      }
    }
    systems?: {
      systemName?: string
      purpose?: string
    }[]
  }
}
// #endregion shared-types

// #region Props & Emits
const props = defineProps<{
  optionStore: OptionStore
}>();

const emit = defineEmits<{
  loadOptions: [optionName: OptionName, params?: LoadOptionsParams]
}>();
// #endregion Props & Emits

// #region local-state
const { values, meta, useFieldValue } = useDynamicForm<ClientOnboardingPlannerValues>();

const formName = 'Client Onboarding Planner';
const industryValue = useFieldValue('clientOnboarding.company.industry');

/**
 * Emits an option-loading request.
 */
function requestOptions(optionName: OptionName, params?: LoadOptionsParams) {
  emit('loadOptions', optionName, params);
}

onMounted(() => {
  requestOptions('industry');
  requestOptions('role');
  requestOptions('trainingFormat');
});

const requiresMigration = computed(() =>
  Boolean(values.clientOnboarding?.company?.requiresMigration),
);

const needsTraining = computed(() =>
  Boolean(values.clientOnboarding?.launchApproach?.guidedRollout?.needsTraining),
);
// #endregion local-state

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'clientOnboarding',
    type: 'heading',
    fieldOptions: { label: formName },
    description: 'A realistic intake form that shows reusable templates, grouped fields, repeating sections, choices, and computed props reacting to live form values.',
    fullWidth: true,
    children: [
      {
        name: 'company',
        fieldOptions: { label: 'Company details' },
        description: 'A grouped section for the core account information.',
        fullWidth: true,
        children: [
          {
            name: 'companyName',
            fieldOptions: { label: 'Company name' },
            restriction: { minLength: 2 },
            fullWidth: true,
          },
          {
            name: 'industry',
            type: 'select',
            fieldOptions: { label: 'Industry' },
            description: 'Options are requested from an external source.',
            computedProps: [(field, value) => {
              field.options = props.optionStore.industry;

              // Load the teamSize options, depending on the selected industry
              requestOptions('teamSize', { industry: value.value as string });
            }],
          },
          {
            name: 'teamSize',
            type: 'select',
            fieldOptions: { label: 'Team size' },
            description: 'This select reacts to the industry chosen above.',
            minOccurs: 0,
            computedProps: [(field) => {
              const industry = industryValue.value;
              field.options = props.optionStore.teamSize;

              if (industry)
                field.minOccurs = 1; // Make the field mandatory
              if (!industry)
                field.disabled = true;
              field.description = industry
                ? `Available options for the ${industry} industry are loaded by an external source using an extra parameter.`
                : 'Choose an industry first to load the available team size options.';
            }],
          },
          {
            name: 'requiresMigration',
            type: 'checkbox',
            minOccurs: 0,
            fieldOptions: { label: 'Migrate existing customer data' },
            description: 'Turn this on when records need to be imported from another system.',
            fullWidth: true,
          },
          {
            name: 'migrationDeadline',
            fieldOptions: {
              label: 'Migration deadline',
            },
            description: 'Computed props keep this disabled until data migration is enabled.',
            minOccurs: 0,
            fullWidth: true,
            computedProps: [(field) => {
              if (requiresMigration.value)
                field.minOccurs = 1; // make the field mandatory
              if (!requiresMigration.value)
                field.disabled = true;
              field.description = requiresMigration.value
                ? 'Required because this onboarding includes a migration.'
                : 'Enable data migration to make this field active.';
            }],
          },
        ],
      },
      {
        name: 'projectContacts',
        fieldOptions: { label: 'Project contacts' },
        description: 'Repeat this grouped section for each person who should be involved in the rollout.',
        minOccurs: 1,
        maxOccurs: 3,
        fullWidth: true,
        children: [
          {
            name: 'fullName',
            fieldOptions: { label: 'Full name' },
          },
          {
            name: 'email',
            fieldOptions: { label: 'Work email' },
            restriction: { pattern: '^.+@.+\\..+$' },
          },
          {
            name: 'role',
            type: 'select',
            fieldOptions: { label: 'Role' },
            computedProps: [(field) => {
              field.options = props.optionStore.role;
            }],
          },
        ],
      },
      {
        name: 'launchApproach',
        fieldOptions: { label: 'Launch approach' },
        description: 'Choice fields keep mutually exclusive onboarding paths in the same metadata model.',
        fullWidth: true,
        choice: [
          {
            name: 'selfServe',
            fieldOptions: { label: 'Self-serve launch' },
            fullWidth: true,
            children: [
              {
                name: 'goLiveDate',
                fieldOptions: { label: 'Target go-live date' },
                fullWidth: true,
              },
              {
                name: 'internalOwner',
                fieldOptions: { label: 'Client-side owner' },
                fullWidth: true,
              },
            ],
          },
          {
            name: 'guidedRollout',
            fieldOptions: { label: 'Guided rollout' },
            fullWidth: true,
            children: [
              {
                name: 'kickoffDate',
                fieldOptions: { label: 'Kickoff call date' },
                fullWidth: true,
              },
              {
                name: 'needsTraining',
                type: 'checkbox',
                minOccurs: 0,
                fieldOptions: { label: 'Include team training' },
                fullWidth: true,
              },
              {
                name: 'trainingFormat',
                type: 'select',
                minOccurs: 0,
                fieldOptions: {
                  label: 'Training format',
                },
                description: 'Another computed field that reacts to the current form state.',
                fullWidth: true,
                computedProps: [(field) => {
                  field.options = props.optionStore.trainingFormat;
                  if (needsTraining.value)
                    field.minOccurs = 1; // Make the field mandatory
                  if (!needsTraining.value)
                    field.disabled = true;
                  field.description = needsTraining.value
                    ? 'Required because guided rollout includes team training.'
                    : 'Enable team training to choose a format.';
                }],
              },
            ],
          },
        ],
      },
      {
        name: 'systems',
        fieldOptions: { label: 'Systems to connect' },
        description: 'Repeat integration details without manually wiring FieldArray logic.',
        minOccurs: 1,
        maxOccurs: 4,
        fullWidth: true,
        children: [
          {
            name: 'systemName',
            fieldOptions: { label: 'System name' },
          },
          {
            name: 'purpose',
            fieldOptions: { label: 'Purpose in the rollout' },
          },
        ],
      },
    ],
  },
];
// #endregion metadata
</script>

<template>
  <div class="form-demo flex flex-col gap-2">
    <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h2 class="text-lg font-semibold text-slate-900">
        {{ formName }}
      </h2>
      <p class="mt-1 text-sm leading-6 text-slate-600">
        A concrete demo for a SaaS team collecting everything needed to onboard a new client.
        It highlights reusable templates, grouped sections, repeatable contacts, mutually exclusive launch paths, and computed fields that become required only when they matter.
      </p>
    </div>
    <AdvancedForm :metadata />
    <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
IsDirty: {{ meta.dirty }}
Touched: {{ meta.touched }}
Valid: {{ meta.valid }}

// form values:
{{ JSON.stringify(values, null, 2) }}
    </pre>
  </div>
</template>
