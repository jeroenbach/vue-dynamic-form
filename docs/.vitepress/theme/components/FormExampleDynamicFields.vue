<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import { onMounted } from 'vue';
import AdvancedForm from './AdvancedForm.vue';

// #region shared-types
export interface SelectOption {
  key: string
  value: string
}

export interface OptionStore {
  industry: SelectOption[]
  teamSize: SelectOption[]
}

export type OptionName = keyof OptionStore;

export interface LoadOptionsParams {
  industry?: string
}

export interface DynamicFieldsValues {
  industry?: string
  teamSize?: string
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
const { values, meta } = useDynamicForm<DynamicFieldsValues>();

/** Emits an option-loading request. */
function requestOptions(optionName: OptionName, params?: LoadOptionsParams) {
  emit('loadOptions', optionName, params);
}

onMounted(() => {
  requestOptions('industry');
});
// #endregion local-state

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'company',
    type: 'heading',
    fieldOptions: { label: 'Company details' },
    children: [
      {
        name: 'industry',
        type: 'select',
        fieldOptions: { label: 'Industry' },
        description: 'Options are requested from an external source.',
        // #region computed-props
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
        computedProps: [(field, value) => {
          field.options = props.optionStore.teamSize;

          // Reset the value if it is not in the new options
          if (props.optionStore.teamSize.every(x => x.key !== value.value))
            value.value = undefined;
        }],
        // #endregion computed-props
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
