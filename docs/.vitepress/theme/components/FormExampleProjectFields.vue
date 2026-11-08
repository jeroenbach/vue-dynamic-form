<script setup lang="ts">
import type { DynamicFormSettings } from '@bach.software/vue-dynamic-form';
import type { Metadata } from './ProjectFormTemplate';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import ProjectFormTemplate from './ProjectFormTemplate.vue';

// #region local-state
const { values, meta } = useDynamicForm();

// Recommended pattern: don't show an error until the user leaves the field, then keep
// validating live so a correction clears the error without another blur.
const settings: DynamicFormSettings = {
  validateOnValueUpdate: false,
  validateOnBlur: true,
};
// #endregion local-state

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'review',
    type: 'heading',
    fieldOptions: { label: 'Project review' },
    children: [
      { name: 'projectName', type: 'text', fieldOptions: { label: 'Project name' }, placeholder: 'e.g. Apollo' },
      { name: 'rating', type: 'rating', fieldOptions: { label: 'Overall rating' }, maxRating: 5 },
      { name: 'likelihood', type: 'range', fieldOptions: { label: 'How likely are you to recommend us?' }, min: 0, max: 10, step: 1, colSpan: 'full', minOccurs: 0 },
    ],
  },
];
// #endregion metadata
</script>

<template>
  <div class="form-demo flex flex-col gap-6 max-w-3xl mx-auto">
    <DynamicForm :metadata="metadata" :template="ProjectFormTemplate" :settings />
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
