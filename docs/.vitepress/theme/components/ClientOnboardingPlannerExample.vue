<!-- #region client-onboarding-planner-example -->
<script setup lang="ts">
import type { ComputedPropsFieldOf } from '@bach.software/vue-dynamic-form';
import type { LoadingResolve } from '../utils/loadingResolve';
import type { Metadata } from './AdvancedFormTemplate.vue';
import type { Props as ReviewGroupProps } from './ReviewGroup.vue';
import type { TimelineItem } from './SubmissionSuccess.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import { computed, onMounted, ref, watch } from 'vue';
import AdvancedForm from './AdvancedForm.vue';
import SubmissionSuccess from './SubmissionSuccess.vue';

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

export type LaunchApproach = 'selfServe' | 'guidedRollout';

export interface LoadOptionsParams {
  industry?: string
}

export interface ClientOnboardingPlannerValues {
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
const { values, meta, useFieldValue, handleSubmit, validateSection, resetForm } = useDynamicForm<ClientOnboardingPlannerValues>({ keepValuesOnUnmount: true });

const formName = 'Client Onboarding';
const industryValue = useFieldValue('company.industry');
const submitted = ref<ClientOnboardingPlannerValues | undefined>(undefined);

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
  Boolean(values?.company?.requiresMigration),
);

const needsTraining = computed(() =>
  Boolean(values?.launchApproach?.guidedRollout?.needsTraining),
);

const selectedLaunchApproach = ref<LaunchApproach>('selfServe');

const industryLabel = computed(() =>
  props.optionStore.industry.find(o => o.key === industryValue.value)?.value,
);
// #endregion local-state

// #region validation
const wizardPagePaths: Record<number, string> = {};

function registerWizardPagePath(field: ComputedPropsFieldOf<Metadata>) {
  if (!field.parent?.children?.length || field.path.includes('['))
    return;
  const index = field.parent.children.findIndex(x => x.name === field.name);
  if (index !== -1)
    wizardPagePaths[index] = field.path;
}

async function validatePage(pageIndex: number, resolve: LoadingResolve) {
  const result = await validateSection(wizardPagePaths[pageIndex] ?? '');
  resolve(result.valid);
}

function dateValidation(value: unknown) {
  if (!value)
    return true;
  return /^(?:0[1-9]|[12]\d|3[01])\/(?:0[1-9]|1[0-2])\/\d{4}$/.test(String(value)) || 'Please enter a valid date (dd/mm/yyyy)';
}
// #endregion validation

// #region summary information
const wizardSummary = computed<ReviewGroupProps[]>(() => {
  const launchRows = (): ReviewGroupProps['rows'] => {
    if (selectedLaunchApproach.value === 'selfServe') {
      return [
        ['Approach', 'Self-serve launch'],
        ['Go-live date', values?.launchApproach?.selfServe?.goLiveDate || '—'],
        ['Client-side owner', values?.launchApproach?.selfServe?.internalOwner || '—'],
      ];
    }
    if (selectedLaunchApproach.value === 'guidedRollout') {
      return [
        ['Approach', 'Guided rollout'],
        ['Kickoff', values?.launchApproach?.guidedRollout?.kickoffDate || '—'],
        ['Training', values?.launchApproach?.guidedRollout?.needsTraining ? (values?.launchApproach?.guidedRollout?.trainingFormat || 'Yes') : 'Not included'],
      ];
    }
    return [['Approach', 'Not chosen']];
  };

  return [
    {
      title: 'Company',
      rows: [
        ['Company name', values?.company?.companyName || '—'],
        ['Industry', industryLabel.value || '—'],
        ['Team size', values?.company?.teamSize || '—'],
        ['Data migration', values?.company?.requiresMigration ? `Yes${values?.company?.migrationDeadline ? ` (by ${values.company.migrationDeadline})` : ''}` : 'No'],
      ],
    },
    {
      title: 'Contacts',
      rows: (values?.projectContacts?.length ?? 0) === 0
        ? [['Contacts', '—']]
        : values!.projectContacts!.map((c, i): [string, string] => [
            `Contact ${i + 1}`,
            [c.fullName || '—', c.role, c.email].filter(Boolean).join(' · '),
          ]),
    },
    {
      title: 'Launch approach',
      rows: launchRows(),
    },
    {
      title: 'Systems',
      rows: (values?.systems?.length ?? 0) === 0
        ? [['Systems', 'None']]
        : values!.systems!.map((s, i): [string, string] => [
            `System ${i + 1}`,
            `${s.systemName || '—'}${s.purpose ? ` — ${s.purpose}` : ''}`,
          ]),
    },
  ];
});
// #endregion summary information

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'wizard',
    path: '',
    type: 'wizard',
    fieldOptions: { label: formName },
    description: 'New client setup',
    submitButtonText: 'Submit onboarding',
    validatePage,
    submitForm: async (resolve: LoadingResolve) => {
      handleSubmit(
        (values) => {
          submitted.value = values;
          resolve(true);
        },
        () => resolve(false),
      )();
    },
    children: [
      {
        name: 'company',
        type: 'wizardPage',
        fieldOptions: { label: 'Company details' },
        description: 'Core account information for the rollout.',
        helpText: 'Who are we onboarding?',
        computedProps: [registerWizardPagePath],
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
            minOccurs: 0,
            computedProps: [(field) => {
              const industry = industryValue.value;
              field.options = props.optionStore.teamSize;

              if (industry)
                field.minOccurs = 1; // Make the field mandatory
              if (!industry) {
                field.dependentOnMessage = 'Choose an industry to see team size options';
              }
              field.description = `Available options for the ${industry} industry are loaded by an external source using an extra parameter.`;
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
            description: 'When must all historical records be live in the new system?',
            minOccurs: 0,
            fullWidth: true,
            validation: dateValidation,
            placeholder: 'dd/mm/yyyy',
            computedProps: [(field) => {
              if (requiresMigration.value)
                field.minOccurs = 1; // make the field mandatory
              if (!requiresMigration.value)
                field.hide = true;
            }],
          },
        ],
      },
      {
        name: 'projectContacts',
        type: 'wizardPage',
        fieldOptions: { label: 'Project contacts' },
        description: 'Anyone who should be looped in on the rollout.',
        helpText: 'Who should we work with?',
        arrayItemName: 'contact',
        arrayItemNamePlural: 'contacts',
        arrayItemFieldForTitle: 'fullName',
        computedProps: [registerWizardPagePath],
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
            fullWidth: true,
            fieldOptions: { label: 'Role' },
            computedProps: [(field) => {
              field.options = props.optionStore.role;
            }],
          },
        ],
      },
      {
        name: 'launchApproach',
        type: 'wizardPage',
        fieldOptions: { label: 'Launch approach' },
        description: `Pick one. You can switch later if plans change — we'll keep the fields you've filled in.`,
        helpText: 'How will we go live?',
        fullWidth: true,
        computedProps: [registerWizardPagePath],
        changeChoice: key => selectedLaunchApproach.value = key as LaunchApproach,
        choice: [
          {
            name: 'selfServe',
            fieldOptions: { label: 'Self-serve launch' },
            description: 'The client drives the rollout themselves. Fastest path to go-live.',
            iconName: 'bolt',
            fullWidth: true,
            computedProps: [
              (thisField) => {
                if (selectedLaunchApproach.value !== 'selfServe')
                  thisField.hide = true;
              },
            ],
            children: [
              {
                hide: true,
                computedProps: [
                  (_, thisValue) => {
                    // The choice fields are "enabled" once 1 of the values is filled in, we simulate this here
                    thisValue.value = selectedLaunchApproach.value === 'selfServe' ? true : undefined;
                  },
                ],
              },
              {
                name: 'goLiveDate',
                fieldOptions: { label: 'Target go-live date' },
                validation: dateValidation,
                placeholder: 'dd/mm/yyyy',
              },
              {
                name: 'internalOwner',
                fieldOptions: { label: 'Client-side owner' },
              },
            ],
          },
          {
            name: 'guidedRollout',
            fieldOptions: { label: 'Guided rollout' },
            description: 'We run kickoff, training, and launch alongside the client team.',
            iconName: 'users',
            fullWidth: true,
            computedProps: [
              (thisField) => {
                if (selectedLaunchApproach.value !== 'guidedRollout')
                  thisField.hide = true;
              },
            ],
            children: [
              {
                hide: true,
                computedProps: [
                  (_, thisValue) => {
                    // The choice fields are "enabled" once 1 of the values is filled in, we simulate this here
                    thisValue.value = selectedLaunchApproach.value === 'guidedRollout' ? true : undefined;
                  },
                ],
              },
              {
                name: 'kickoffDate',
                fieldOptions: { label: 'Kickoff call date' },
                fullWidth: true,
                validation: dateValidation,
                placeholder: 'dd/mm/yyyy',
              },
              {
                name: 'needsTraining',
                type: 'checkbox',
                minOccurs: 0,
                fieldOptions: { label: 'Include team training' },
                description: 'Turn on to schedule a training session during onboarding.',
                fullWidth: true,
                falseAsUndefined: true,
              },
              {
                name: 'trainingFormat',
                type: 'select',
                minOccurs: 0,
                fieldOptions: {
                  label: 'Training format',
                },
                description: 'Required because guided rollout includes team training.',
                fullWidth: true,
                computedProps: [(field) => {
                  field.options = props.optionStore.trainingFormat;
                  if (needsTraining.value)
                    field.minOccurs = 1; // Make the field mandatory
                  if (!needsTraining.value)
                    field.hide = true;
                }],
              },
            ],
          },
        ],
      },
      {
        name: 'systems',
        type: 'wizardPage',
        fieldOptions: { label: 'Systems to connect' },
        description: `Any external tools we'll integrate with during onboarding.`,
        helpText: 'What needs to connect?',
        arrayNoItemsMessage: `Skip this step if there's nothing to integrate.`,
        arrayItemName: 'system',
        arrayItemNamePlural: 'systems',
        arrayItemFieldForTitle: 'systemName',
        minOccurs: 0,
        maxOccurs: 4,
        autoAddMinOccurs: false,
        fullWidth: true,
        computedProps: [registerWizardPagePath],
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
      {
        name: 'summaryPage',
        type: 'wizardSummaryPage',
        fieldOptions: { label: 'Review & submit' },
        description: 'Quick recap before we kick this off. Anything needs tweaking? Jump back to the step.',
        helpText: 'Check and submit',
        minOccurs: 0,
        computedProps: [registerWizardPagePath, (field) => { field.wizardSummary = wizardSummary.value; }],
      },
    ],
  },
];
// #endregion metadata

// #region timeline
const timeline = ref<TimelineItem[]>([]);

watch(submitted, async (isSubmitted) => {
  if (!isSubmitted) {
    timeline.value = [];
    return;
  }

  const contactCount = values?.projectContacts?.length ?? 0;
  const systemCount = values?.systems?.length ?? 0;

  timeline.value = [
    { id: 'workspace', label: 'Workspace created', status: 'pending' },
    { id: 'invites', label: `Invites sent to ${contactCount} contact${contactCount !== 1 ? 's' : ''}`, status: 'pending' },
    { id: 'kickoff', label: 'Kickoff being scheduled', status: 'pending' },
    { id: 'integrations', label: `${systemCount} system integration${systemCount !== 1 ? 's' : ''} added to backlog`, status: 'pending' },
  ];

  for (let i = 0; i < timeline.value.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 800));
    timeline.value[i].status = 'done';
  }
});
// #endregion timeline

// #region Helper methods
function reset() {
  resetForm();
  submitted.value = undefined;
}
// #endregion Helper methods
</script>

<template>
  <div class="form-demo flex flex-col gap-6">
    <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {{ formName }}
      </h2>
      <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
        A concrete demo for a SaaS team collecting everything needed to onboard a new client.
        It highlights reusable templates, grouped fields, repeatable contacts, mutually exclusive launch paths, and computed fields that become required only when they matter.
      </p>
    </div>
    <AdvancedForm v-if="!submitted" :metadata />
    <SubmissionSuccess
      v-else
      :title="`Onboarding kicked off for ${values.company?.companyName}`"
      referenceCode="ONB-20260430-R7ME"
      timelineTitle="What happens next"
      :submittedJson="JSON.stringify(submitted, null, 2) "
      :timeline
      @reset="reset"
    />
    <pre
      v-if="!submitted"
      class="mt-4 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100"
    >
IsDirty: {{ meta.dirty }}
Touched: {{ meta.touched }}
Valid: {{ meta.valid }}

// form values:
{{ JSON.stringify(values, null, 2) }}
    </pre>
  </div>
</template>
