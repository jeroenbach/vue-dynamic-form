<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import AdvancedForm from './AdvancedForm.vue';

export interface ExplicitChoiceRepeatableValues {
  integrations?: {
    crmExport?: { crmSystem?: string, exportSchedule?: string, order?: number }[]
    apiEndpoint?: { url?: string, apiKey?: string, order?: number }[]
  }
}

const props = defineProps<{
  metadata: Metadata[]
  /**
   * Seeded whenever the demo remounts this component with a new `key`, so occurrence field data
   * survives a toolbar flip even though `displayOrder`/`preserveOrder` are static and only take
   * effect on mount.
   */
  initialValues?: ExplicitChoiceRepeatableValues
}>();

const { values, meta } = useDynamicForm<ExplicitChoiceRepeatableValues>({ initialValues: props.initialValues });

defineExpose({ values });
</script>

<template>
  <div class="flex flex-col gap-6">
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
