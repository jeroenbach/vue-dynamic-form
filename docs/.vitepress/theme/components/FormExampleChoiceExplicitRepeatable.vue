<script setup lang="ts">
import type { Metadata } from './AdvancedFormTemplate.vue';
import type { ExplicitChoiceRepeatableValues } from './FormExampleChoiceExplicitRepeatableForm.vue';
import { computed, ref, useTemplateRef } from 'vue';
import FormExampleChoiceExplicitRepeatableForm from './FormExampleChoiceExplicitRepeatableForm.vue';
import ToggleSwitch from './ToggleSwitch.vue';

type IntegrationOccurrence = Record<string, unknown> & { order?: number };

const displayOrder = ref<'grouped' | 'added'>('grouped');
const preserveOrder = ref(false);

// Bumped on every toolbar flip to force the form to remount: `displayOrder`/`preserveOrder` are
// static, engine-captured-at-setup flags, so changing them only takes effect on a fresh mount.
const formKey = ref(0);
const seedValues = ref<ExplicitChoiceRepeatableValues>();

const formRef = useTemplateRef<InstanceType<typeof FormExampleChoiceExplicitRepeatableForm>>('formRef');

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

function withoutOrder(occurrences?: IntegrationOccurrence[]) {
  return occurrences?.map(({ order: _order, ...rest }) => rest);
}

/**
 * Snapshots the currently entered values so they survive the remount a toolbar flip causes.
 * `order` is stripped from the snapshot when `preserveOrder` is being turned off, since the
 * engine never removes a pre-existing `order` on its own and the reader needs to see it actually
 * disappear from the values dump.
 */
function snapshotValues(stripOrder: boolean): ExplicitChoiceRepeatableValues | undefined {
  const current = formRef.value?.values;
  if (!current)
    return undefined;

  const cloned = JSON.parse(JSON.stringify(current)) as ExplicitChoiceRepeatableValues;
  if (!stripOrder || !cloned.integrations)
    return cloned;

  return {
    ...cloned,
    integrations: {
      crmExport: withoutOrder(cloned.integrations.crmExport),
      apiEndpoint: withoutOrder(cloned.integrations.apiEndpoint),
    },
  };
}

function remountWith(applyChange: () => void) {
  applyChange();
  seedValues.value = snapshotValues(!preserveOrder.value);
  formKey.value += 1;
}

function setDisplayOrder(next: 'grouped' | 'added') {
  if (next === displayOrder.value)
    return;
  remountWith(() => {
    displayOrder.value = next;
  });
}

function setPreserveOrder(next: boolean) {
  if (next === preserveOrder.value)
    return;
  remountWith(() => {
    preserveOrder.value = next;
  });
}
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
            @click="setDisplayOrder('grouped')"
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
            @click="setDisplayOrder('added')"
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
          @update:checked="setPreserveOrder(!!$event)"
        />
        <span class="text-sm text-slate-700 dark:text-slate-300">preserveOrder</span>
      </div>
    </div>

    <div
      v-if="displayOrder === 'added' && !preserveOrder"
      class="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-200"
    >
      <strong>This order will not survive a reload.</strong> Add-order display is ephemeral: reloading the page,
      or remounting the form the way flipping either control here does, falls back to grouped order. Turn on
      <code>preserveOrder</code> to make it survive.
    </div>

    <FormExampleChoiceExplicitRepeatableForm
      ref="formRef"
      :key="formKey"
      :metadata="metadata"
      :initialValues="seedValues"
    />
  </div>
</template>
