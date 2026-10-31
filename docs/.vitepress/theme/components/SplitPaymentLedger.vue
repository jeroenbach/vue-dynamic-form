<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { ChoiceOption } from './ChoiceSectionCard.vue';
import type { SplitPaymentBranchShape } from './splitPaymentLedgerMath';
import { useFormContext } from 'vee-validate';
import { computed } from 'vue';
import ChoiceArraySectionCard from './ChoiceArraySectionCard.vue';
import {
  collectSplitPaymentOccurrences,
  computeSplitPaymentLedger,
  readPath,
} from './splitPaymentLedgerMath';

/**
 * The split-payment ledger container: the add-source buttons (via `ChoiceArraySectionCard`),
 * the dashed empty state, and the live remaining-to-assign readout. The rows themselves render
 * through the default slot, one `SplitPaymentLedgerRow` per active occurrence.
 *
 * Takes the resolved branch shapes and its own path as plain data, not the raw templated
 * `FieldMetadata` object: the host template's metadata type is a union specific to its own
 * fields, which a shared component typed against the library's generic `FieldMetadata` cannot
 * accept without widening every caller's types.
 */
export interface Props {
  splitPaymentPath: string
  branches: SplitPaymentBranchShape[]
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  errorMessage?: string
  dataTestid?: string
  options?: ChoiceOption[]
  addChoiceOccurrence?: (branchKey: string) => void
  canAddChoiceOccurrence?: (branchKey: string) => boolean
  usedChoiceOccurrences?: number
  maxOccurs?: number
  orderTotal: number
}

const props = defineProps<Props>();

const { values } = useFormContext();

const occurrences = computed(() =>
  collectSplitPaymentOccurrences(readPath(values, props.splitPaymentPath), props.branches));

const ledger = computed(() => computeSplitPaymentLedger(occurrences.value, props.orderTotal));

// Three states: covered (emerald), short of the total (amber), or over it (rose). The exact
// wording and the blocking banner live on the hidden coverage field's own validation message,
// rendered elsewhere; this readout is the instant, always-in-sync local echo of the same numbers.
const readoutState = computed<'ok' | 'short' | 'over'>(() => {
  if (ledger.value.remainingToAssign === 0)
    return 'ok';
  return ledger.value.remainingToAssign > 0 ? 'short' : 'over';
});

const readoutLabel = computed(() => ({
  ok: 'Remaining to assign',
  short: 'Still unassigned',
  over: 'Overshoot',
}[readoutState.value]));

const readoutAmount = computed(() => Math.abs(ledger.value.remainingToAssign));
</script>

<template>
  <ChoiceArraySectionCard
    :label
    :description
    :error-message="errorMessage"
    :dataTestid
    :options
    :addChoiceOccurrence
    :canAddChoiceOccurrence
    :usedChoiceOccurrences
    :maxOccurs
  >
    <div
      v-if="occurrences.length === 0"
      class="md:col-span-2 flex items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400"
      :data-testid="dataTestid ? `${dataTestid}-empty` : undefined"
    >
      No payment sources yet. Add one above to begin covering the {{ orderTotal.toFixed(2) }} order total.
    </div>
    <div v-else class="md:col-span-2 flex flex-col gap-3">
      <div class="flex flex-col gap-3">
        <slot />
      </div>

      <div
        class="flex items-center justify-between rounded-lg border p-3 text-sm"
        :class="{
          'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200': readoutState === 'ok',
          'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200': readoutState === 'short',
          'border-red-300 dark:border-rose-700 bg-red-50 dark:bg-rose-950 text-red-800 dark:text-rose-200': readoutState === 'over',
        }"
        :data-testid="dataTestid ? `${dataTestid}-readout` : undefined"
      >
        <span>{{ readoutLabel }}</span>
        <span class="font-semibold" style="font-variant-numeric: tabular-nums">{{ readoutAmount.toFixed(2) }}</span>
      </div>
    </div>
  </ChoiceArraySectionCard>
</template>
