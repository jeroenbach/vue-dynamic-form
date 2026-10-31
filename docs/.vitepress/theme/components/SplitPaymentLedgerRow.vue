<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { SplitPaymentBranchShape } from './splitPaymentLedgerMath';
import { useFormContext } from 'vee-validate';
import { computed, toValue } from 'vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';
import {
  collectSplitPaymentOccurrences,
  computeSplitPaymentLedger,
  readPath,
} from './splitPaymentLedgerMath';

/**
 * One occurrence of the split-payment ledger: shows what this source applies and what remains
 * after it, and lets the shopper reorder it. Everything here is derived live from the form's own
 * values (read through vee-validate's own context, the same channel `DynamicForm` itself uses),
 * so reordering needs no plumbing beyond writing two `order` values.
 *
 * Takes its own path, its parent's path, and the resolved branch shapes as plain data, not the
 * raw templated `FieldMetadata` object: see `SplitPaymentLedger`'s own note on why.
 */
export interface Props {
  path: string
  splitPaymentPath: string
  branches: SplitPaymentBranchShape[]
  branchKey: string
  index: number
  globalIndex: number
  label?: MaybeRefOrGetter<string | undefined>
  canRemove?: boolean
  orderTotal: number
}

const props = defineProps<Props>();

defineEmits<{
  remove: []
}>();

const { values, setFieldValue } = useFormContext();

const occurrences = computed(() =>
  collectSplitPaymentOccurrences(readPath(values, props.splitPaymentPath), props.branches));

const myKey = computed(() => `${props.branchKey}[${props.index}]`);
const myOccurrence = computed(() => occurrences.value.find(occurrence => occurrence.key === myKey.value));
const myOrder = computed(() => myOccurrence.value?.order ?? props.globalIndex + 1);

const ledger = computed(() => computeSplitPaymentLedger(occurrences.value, props.orderTotal));
const myEntry = computed(() => ledger.value.entries.find(entry => entry.key === myKey.value));
const appliedAmount = computed(() => myEntry.value?.appliedAmount ?? 0);
const remainingAfter = computed(() => myEntry.value?.remainingAfter ?? 0);

const upDisabled = computed(() => !occurrences.value.some(occurrence => occurrence.order === myOrder.value - 1));
const downDisabled = computed(() => !occurrences.value.some(occurrence => occurrence.order === myOrder.value + 1));

const isLastRow = computed(() => props.globalIndex === occurrences.value.length - 1);
const isIncomplete = computed(() => isLastRow.value && ledger.value.remainingToAssign !== 0);

const dataTestid = computed(() => props.path);
const labelText = computed(() => toValue(props.label) ?? 'this source');

function moveUp() {
  const neighbor = occurrences.value.find(occurrence => occurrence.order === myOrder.value - 1);
  if (!neighbor)
    return;
  setFieldValue(`${props.splitPaymentPath}.${neighbor.key}.order`, myOrder.value, false);
  setFieldValue(`${props.path}.order`, myOrder.value - 1, false);
}

function moveDown() {
  const neighbor = occurrences.value.find(occurrence => occurrence.order === myOrder.value + 1);
  if (!neighbor)
    return;
  setFieldValue(`${props.splitPaymentPath}.${neighbor.key}.order`, myOrder.value, false);
  setFieldValue(`${props.path}.order`, myOrder.value + 1, false);
}
</script>

<template>
  <article
    class="rounded-xl border bg-white dark:bg-slate-900 p-4 flex flex-wrap items-start gap-4"
    :class="isIncomplete ? 'border-amber-300 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700'"
    :data-testid="dataTestid"
  >
    <div class="flex shrink-0 flex-col items-center gap-2">
      <span class="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
        {{ globalIndex + 1 }}
      </span>
      <div class="flex gap-1">
        <AppButton
          variant="ghost"
          :disabled="upDisabled"
          :aria-label="`Move ${labelText} up`"
          :dataTestid="dataTestid ? `${dataTestid}-move-up` : undefined"
          @click="moveUp"
        >
          <AppIcon name="chevronUp" />
        </AppButton>
        <AppButton
          variant="ghost"
          :disabled="downDisabled"
          :aria-label="`Move ${labelText} down`"
          :dataTestid="dataTestid ? `${dataTestid}-move-down` : undefined"
          @click="moveDown"
        >
          <AppIcon name="chevronDown" />
        </AppButton>
      </div>
    </div>

    <div class="min-w-[180px] flex-1 basis-[200px]">
      <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {{ labelText }}
      </p>
      <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <slot />
      </div>
    </div>

    <div class="min-w-[140px] shrink-0 text-right flex flex-col gap-1" :data-testid="dataTestid ? `${dataTestid}-amounts` : undefined">
      <span class="text-sm font-semibold text-slate-900 dark:text-slate-100" style="font-variant-numeric: tabular-nums">
        − {{ appliedAmount.toFixed(2) }}
      </span>
      <span class="text-xs text-slate-500 dark:text-slate-400" style="font-variant-numeric: tabular-nums">
        Remaining after: {{ remainingAfter.toFixed(2) }}
      </span>
    </div>

    <AppButton
      variant="danger-light"
      class="shrink-0"
      :disabled="!canRemove"
      :aria-label="`Remove ${labelText}`"
      :dataTestid="dataTestid ? `${dataTestid}-remove-button` : undefined"
      @click="$emit('remove')"
    >
      <AppIcon name="bin" />
    </AppButton>
  </article>
</template>
