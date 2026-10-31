<script lang="ts" setup>
/**
 * The live summary side panel, modeled on `OrderSummary.vue` and `TestInboxPanel.vue`: a sticky
 * aside that takes everything it shows as host-computed props, rather than reading the form
 * itself, so it stays a trivially testable, form-agnostic panel with one source of truth.
 *
 * Shows the at-a-glance timeline, the non-blocking venue-overflow indicator, the curfew-status
 * banner (the hard-blocking rule), and the per-kind count chips. A fully empty program gets its
 * own parallel state instead: no timeline, no overflow block, no count chips, just a muted
 * placeholder and an all-clear curfew banner (there is nothing yet to breach it).
 */
export interface CurfewBreachSummary {
  key: string
  /** The item's 1-based position in the rendered program, matching the row's own position badge. */
  position: number
  /** The breaching item's own branch label, e.g. "Band / DJ set". */
  label: string
  /** The breaching item's computed end time, formatted 24-hour `HH:MM`. */
  endTime: string
}

export interface SummaryTimelineEntry {
  key: string
  /** The item's own branch label, e.g. "Welcome speech". */
  label: string
  /** The item's computed start time, formatted 24-hour `HH:MM`. */
  startTime: string
  /** True when this item also appears in `curfewBreaches`, so its row can be tinted rose. */
  isBreaching: boolean
}

export interface SummaryKindCount {
  branchKey: string
  /** Fully formatted chip text, e.g. "2 dinner courses" or "0 breaks". */
  text: string
}

export interface Props {
  /** One row per program item, in rendered order. Empty exactly when the program is empty. */
  timeline: SummaryTimelineEntry[]
  /** The program's computed end time, formatted 24-hour `HH:MM`. */
  programEndTime: string
  /** The venue-close anchor, formatted 24-hour `HH:MM`. */
  venueCloseTime: string
  /**
   * Program end minus venue close, both already lifted into the same minutes-since-event-start
   * frame by the host: positive means minutes past venue close, zero or negative means minutes
   * still to spare. A duration total, so reordering alone can never change it.
   */
  venueOverflowMinutes: number
  counts: SummaryKindCount[]
  curfewBreaches: CurfewBreachSummary[]
  /** The amplified-music curfew, formatted 24-hour `HH:MM`, for the banner's own wording. */
  curfewTime: string
}

defineProps<Props>();
</script>

<template>
  <aside class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm" data-testid="run-of-show-summary">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
      Evening at a glance
    </h3>

    <template v-if="timeline.length === 0">
      <div
        class="mt-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400"
        data-testid="run-of-show-summary-empty"
      >
        The timeline appears here as you add items.
      </div>
      <div
        class="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-3 text-sm text-emerald-900 dark:text-emerald-200"
        data-testid="run-of-show-curfew-banner"
      >
        No amplified items yet, so nothing can breach the curfew.
      </div>
    </template>

    <template v-else>
      <ul class="mt-4 flex flex-col gap-1.5 text-sm" data-testid="run-of-show-summary-timeline">
        <li
          v-for="entry in timeline"
          :key="entry.key"
          class="flex justify-between gap-3"
          :class="entry.isBreaching ? 'text-red-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'"
        >
          <span>{{ entry.label }}</span>
          <span
            :class="entry.isBreaching ? 'text-red-700 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'"
            style="font-variant-numeric: tabular-nums"
          >{{ entry.startTime }}</span>
        </li>
      </ul>

      <!-- #region venue-overflow -->
      <div class="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3" data-testid="run-of-show-venue-overflow">
        <div class="flex justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>Program ends</span>
          <strong style="font-variant-numeric: tabular-nums">{{ programEndTime }}</strong>
        </div>
        <div class="flex justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>Venue closes</span>
          <strong style="font-variant-numeric: tabular-nums">{{ venueCloseTime }}</strong>
        </div>
        <div
          class="mt-2 rounded-lg p-2 text-sm"
          :class="venueOverflowMinutes > 0
            ? 'border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
            : 'border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200'"
        >
          <template v-if="venueOverflowMinutes > 0">
            Program runs {{ venueOverflowMinutes }} minutes past venue close. This is a duration total, not an order problem: reordering cannot fix it.
          </template>
          <template v-else>
            Within venue hours ({{ -venueOverflowMinutes }} minutes to spare).
          </template>
        </div>
      </div>
      <!-- #endregion venue-overflow -->

      <div
        v-if="curfewBreaches.length > 0"
        class="mt-4 rounded-lg border border-red-300 dark:border-rose-700 bg-red-50 dark:bg-rose-950 p-3 text-sm text-red-800 dark:text-rose-200"
        data-testid="run-of-show-curfew-banner"
      >
        <p class="font-semibold">
          Curfew exceeded.
        </p>
        <p v-for="breach in curfewBreaches" :key="breach.key">
          {{ breach.label }} (position {{ breach.position }}) ends {{ breach.endTime }}, after the {{ curfewTime }} curfew.
        </p>
      </div>
      <div
        v-else
        class="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-3 text-sm text-emerald-900 dark:text-emerald-200"
        data-testid="run-of-show-curfew-banner"
      >
        All amplified items end before the {{ curfewTime }} curfew.
      </div>

      <div class="mt-4" data-testid="run-of-show-summary-counts">
        <div class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Program mix
        </div>
        <div class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="count in counts"
            :key="count.branchKey"
            class="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {{ count.text }}
          </span>
        </div>
      </div>
    </template>
  </aside>
</template>
