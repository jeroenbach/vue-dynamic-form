<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { ProgramBranchShape } from './runOfShowMath';
import { useFormContext } from 'vee-validate';
import { computed, toValue } from 'vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';
import {
  collectProgramOccurrences,
  computeTimeline,
  findCakeBeforeDinner,
  findCurfewBreaches,
  findLeadingBreak,
  formatTime,
  liftToEventFrame,
  parseTime,
} from './runOfShowMath';
import { readPath } from './splitPaymentLedgerMath';

/**
 * One occurrence of the run-of-show program: its own kind icon, fields, computed clock chip,
 * reorder controls, and remove control. Everything is derived live from the form's own values
 * (read through vee-validate's own context, the same channel `DynamicForm` itself uses),
 * mirroring `SplitPaymentLedgerRow`.
 *
 * Also renders the dashed curfew marker as its own trailing element when the curfew falls within
 * or right after its own span: the container's single passthrough slot has no insertion point
 * between two specific rows, so each row decides for itself.
 *
 * Takes its own path, its parent's path, and the resolved branch shapes as plain data, not the
 * raw templated `FieldMetadata` object: see `SplitPaymentLedgerRow`'s own note on why.
 *
 * The two non-blocking convention checks (ADR-5) are derived from the same `timeline` this row
 * already builds for its clock chip and curfew state: neither check ever affects `meta.valid`,
 * they are display-only, exactly like the curfew tint below.
 */
export interface Props {
  path: string
  programPath: string
  branches: ProgramBranchShape[]
  branchKey: string
  index: number
  globalIndex: number
  label?: MaybeRefOrGetter<string | undefined>
  canRemove?: boolean
}

const props = defineProps<Props>();

defineEmits<{
  remove: []
}>();

const { values, setFieldValue } = useFormContext();

const KIND_ICONS: Record<string, string> = {
  speech: '🎤',
  dinner: '🍽️',
  band: '🎸',
  dance: '🪩',
  cake: '🎂',
  break: '🧘',
};

const occurrences = computed(() =>
  collectProgramOccurrences(readPath(values, props.programPath), props.branches));

const eventStartMinutes = computed(() => parseTime(readPath(values, 'schedule.eventStart')));
const curfewMinutes = computed(() => parseTime(readPath(values, 'schedule.curfew')));
const curfewAbsolute = computed(() => liftToEventFrame(curfewMinutes.value, eventStartMinutes.value));
const curfewLabel = computed(() => formatTime(curfewMinutes.value));

const timeline = computed(() => computeTimeline(occurrences.value, eventStartMinutes.value));

const myKey = computed(() => `${props.branchKey}[${props.index}]`);
const myOccurrence = computed(() => occurrences.value.find(occurrence => occurrence.key === myKey.value));
const myOrder = computed(() => myOccurrence.value?.order ?? props.globalIndex + 1);
const myEntryIndex = computed(() => timeline.value.entries.findIndex(entry => entry.key === myKey.value));
const myEntry = computed(() => timeline.value.entries[myEntryIndex.value]);

const clockLabel = computed(() => {
  const entry = myEntry.value;
  if (!entry)
    return '';
  return `${formatTime(entry.startMinutes)}–${formatTime(entry.endMinutes)}`;
});

const isAmplified = computed(() => myEntry.value?.amplified ?? false);

const breachingKeys = computed(() =>
  new Set(findCurfewBreaches(timeline.value, curfewMinutes.value, eventStartMinutes.value)));
const isBreaching = computed(() => breachingKeys.value.has(myKey.value));
const breachMinutes = computed(() => {
  const entry = myEntry.value;
  return entry ? entry.endMinutes - curfewAbsolute.value : 0;
});
const myEndLabel = computed(() => {
  const entry = myEntry.value;
  return entry ? formatTime(entry.endMinutes) : '';
});

// Convention checks never affect meta.valid or the curfew: they only decide whether this row
// shows the amber pill. Cake and break are never amplified kinds, so this can never collide with
// isBreaching on the same row.
const cakeBeforeDinnerKeys = computed(() => findCakeBeforeDinner(timeline.value));
const leadingBreakKeys = computed(() => findLeadingBreak(timeline.value));
const isCakeBeforeDinner = computed(() => cakeBeforeDinnerKeys.value.includes(myKey.value));
const isLeadingBreak = computed(() => leadingBreakKeys.value.includes(myKey.value));
const conventionMessage = computed(() => {
  if (isCakeBeforeDinner.value)
    return 'Cake cutting usually comes after every dinner course.';
  if (isLeadingBreak.value)
    return 'The program usually does not open with a break.';
  return undefined;
});

// The curfew falls somewhere inside a contiguous, gapless timeline, so "between two rows" means
// this row's own end is still at or before the curfew while the next row's end has already
// passed it: the crossing happens during the next row, and this row is the last one fully clear
// of it. A row with nothing after it never shows a marker, so the marker can never land on the
// last rendered row.
const showsCurfewMarkerAfter = computed(() => {
  const entry = myEntry.value;
  const nextEntry = timeline.value.entries[myEntryIndex.value + 1];
  if (!entry || !nextEntry)
    return false;
  return entry.endMinutes <= curfewAbsolute.value && nextEntry.endMinutes > curfewAbsolute.value;
});

const upDisabled = computed(() => !occurrences.value.some(occurrence => occurrence.order === myOrder.value - 1));
const downDisabled = computed(() => !occurrences.value.some(occurrence => occurrence.order === myOrder.value + 1));

const kindIcon = computed(() => KIND_ICONS[props.branchKey] ?? '•');

const dataTestid = computed(() => props.path);
const labelText = computed(() => toValue(props.label) ?? 'this item');

// #region reorder-functions
function moveUp() {
  const neighbor = occurrences.value.find(occurrence => occurrence.order === myOrder.value - 1);
  if (!neighbor)
    return;
  setFieldValue(`${props.programPath}.${neighbor.key}.order`, myOrder.value, false);
  setFieldValue(`${props.path}.order`, myOrder.value - 1, false);
}

function moveDown() {
  const neighbor = occurrences.value.find(occurrence => occurrence.order === myOrder.value + 1);
  if (!neighbor)
    return;
  setFieldValue(`${props.programPath}.${neighbor.key}.order`, myOrder.value, false);
  setFieldValue(`${props.path}.order`, myOrder.value + 1, false);
}
// #endregion reorder-functions
</script>

<template>
  <div class="tl-row">
    <div class="tl-node grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-white dark:border-slate-900 bg-indigo-50 dark:bg-indigo-950 text-lg shadow-sm">
      {{ kindIcon }}
    </div>

    <article
      class="rounded-xl border p-4"
      :class="isBreaching
        ? 'border-red-300 dark:border-rose-700 bg-white dark:bg-slate-900'
        : conventionMessage
          ? 'border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'"
      :data-testid="dataTestid"
    >
      <header class="flex flex-wrap items-center gap-2">
        <span class="grid h-6 w-6 place-items-center rounded-full bg-indigo-50 dark:bg-indigo-950 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {{ globalIndex + 1 }}
        </span>
        <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ labelText }}</span>
        <span v-if="isAmplified" class="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
          Amplified
        </span>
        <span v-if="conventionMessage" class="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
          Convention
        </span>
        <span
          class="ml-auto rounded-md px-2 py-0.5 text-xs font-bold"
          :class="isBreaching
            ? 'border border-red-300 dark:border-rose-700 bg-red-50 dark:bg-rose-950 text-red-800 dark:text-rose-200'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'"
          style="font-variant-numeric: tabular-nums"
          :data-testid="`${dataTestid}-clock`"
        >
          {{ clockLabel }}
        </span>
      </header>

      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <slot />
      </div>

      <div
        v-if="isBreaching"
        class="mt-3 flex items-start gap-2 text-xs text-red-700 dark:text-rose-300"
        :data-testid="`${dataTestid}-curfew-message`"
      >
        <span>⚠️</span>
        <span>Ends {{ myEndLabel }}, {{ breachMinutes }} minutes after the {{ curfewLabel }} curfew. Move this item earlier, or shorten an item above it.</span>
      </div>

      <div
        v-if="conventionMessage"
        class="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300"
        :data-testid="`${dataTestid}-convention-message`"
      >
        <span>⚠️</span>
        <span>{{ conventionMessage }}</span>
      </div>

      <div class="mt-3 flex items-center gap-2">
        <div class="ml-auto flex gap-1">
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
          <AppButton
            variant="danger-light"
            :disabled="!canRemove"
            :aria-label="`Remove ${labelText}`"
            :dataTestid="dataTestid ? `${dataTestid}-remove-button` : undefined"
            @click="$emit('remove')"
          >
            <AppIcon name="bin" />
          </AppButton>
        </div>
      </div>
    </article>
  </div>

  <div
    v-if="showsCurfewMarkerAfter"
    class="ml-[58px] mb-3.5 flex items-center gap-2.5"
    :data-testid="`${dataTestid}-curfew-marker`"
  >
    <span class="whitespace-nowrap rounded-full border border-red-300 dark:border-rose-700 bg-red-50 dark:bg-rose-950 px-2.5 py-0.5 text-[11px] font-bold text-red-700 dark:text-rose-300">
      Amplified-music curfew · {{ curfewLabel }}
    </span>
    <span class="flex-1 border-t-2 border-dashed border-red-300 dark:border-rose-700" />
  </div>
</template>

<style scoped>
.tl-row {
  position: relative;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 14px;
  padding-bottom: 14px;
}
</style>
