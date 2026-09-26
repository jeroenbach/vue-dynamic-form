<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import { computed, ref } from 'vue';
import AdvancedForm from './AdvancedForm.vue';
import ToggleSwitch from './ToggleSwitch.vue';

export interface ExplicitChoiceRepeatableValues {
  integrations?: {
    crmExport?: { crmSystem?: string, exportSchedule?: string, order?: number }[]
    apiEndpoint?: { url?: string, apiKey?: string, order?: number }[]
  }
}

// Both flags are reactive engine metadata: flipping them through the computed metadata below
// takes effect in place, no remount needed. Turning preserveOrder on seeds `order` into the
// existing occurrences, turning it off strips it again; both are visible live in the values dump.
const displayOrder = ref<'grouped' | 'added'>('grouped');
const preserveOrder = ref(false);

const { values, meta } = useDynamicForm<ExplicitChoiceRepeatableValues>();

// #region metadata
const metadata = computed<Metadata[]>(() => [
  {
    name: 'integrations',
    type: 'heading',
    fieldOptions: { label: 'Integrations to add' },
    description: 'Add up to 5 integrations in any mix. Each kind is capped at 3 in total (maxOccursTotal), so its Add button disables independently.',
    maxOccurs: 5,
    explicitChoiceSelection: true,
    choiceShowChoiceSelect: true,
    displayOrder: displayOrder.value,
    preserveOrder: preserveOrder.value,
    choice: [
      {
        name: 'crmExport',
        maxOccurs: 1,
        maxOccursTotal: 3,
        fullWidth: true,
        fieldOptions: { label: 'CRM export' },
        children: [
          { name: 'crmSystem', type: 'text', fieldOptions: { label: 'CRM system' }, placeholder: 'e.g. Salesforce' },
          { name: 'exportSchedule', type: 'text', fieldOptions: { label: 'Export schedule' }, placeholder: 'e.g. nightly' },
        ],
      },
      {
        name: 'apiEndpoint',
        maxOccurs: 1,
        maxOccursTotal: 3,
        fullWidth: true,
        fieldOptions: { label: 'API endpoint' },
        children: [
          { name: 'url', type: 'text', fieldOptions: { label: 'Endpoint URL' }, placeholder: 'https://example.com/webhook' },
          { name: 'apiKey', type: 'text', fieldOptions: { label: 'API key' } },
        ],
      },
    ],
  },
]);
// #endregion metadata
</script>

<template>
  <div class="form-demo flex flex-col gap-4 max-w-3xl mx-auto">
    <div class="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Display order</span>
        <div role="radiogroup" aria-label="Display order" class="inline-flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-600">
          <button
            type="button"
            role="radio"
            :aria-checked="displayOrder === 'grouped'"
            data-testid="display-order-grouped"
            class="px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            :class="displayOrder === 'grouped'
              ? 'bg-sky-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'"
            @click="displayOrder = 'grouped'"
          >
            Grouped by kind
          </button>
          <button
            type="button"
            role="radio"
            :aria-checked="displayOrder === 'added'"
            data-testid="display-order-added"
            class="border-l border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            :class="displayOrder === 'added'
              ? 'bg-sky-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'"
            @click="displayOrder = 'added'"
          >
            Order added
          </button>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Persist to values</span>
        <ToggleSwitch
          :checked="preserveOrder"
          label="preserveOrder"
          dataTestid="preserve-order-toggle"
          @update:checked="preserveOrder = !!$event"
        />
        <span class="text-sm text-slate-700 dark:text-slate-300">preserveOrder</span>
      </div>
    </div>

    <div
      v-if="displayOrder === 'added' && !preserveOrder"
      class="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-200"
    >
      <strong>This order will not survive a reload.</strong> Add-order display is ephemeral: reloading the page
      falls back to grouped order. Turn on <code>preserveOrder</code> to make it survive.
    </div>

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
