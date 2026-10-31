<script lang="ts" setup>
import type { IntensityLevel, PlanSummary } from './workoutPlanMath';

/**
 * The sticky summary rail: four sections computed live from the plan's own values (total
 * duration, intensity profile, muscle coverage, convention checks). Takes the host's
 * already-computed summary as a single prop and renders it; it never reads the form itself.
 */
export interface Props {
  summary: PlanSummary
}

defineProps<Props>();

// Fixed, flat colors (no dark-mode swap) so the dot sequence reads with the same contrast in
// both color modes, matching the feature's own low/moderate/high palette.
const DOT_COLOR_CLASSES: Record<IntensityLevel | 'unset', string> = {
  low: 'bg-blue-300',
  moderate: 'bg-amber-400',
  high: 'bg-rose-400',
  // Shown while a cardio block's intensity is not filled in yet: neutral, not an invented level.
  unset: 'bg-slate-300 dark:bg-slate-600',
};

function pluralize(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}

// Every muscle-group key in this demo is one plain lowercase word, so capitalizing it is the
// whole job of turning "legs" back into a chip label of "Legs".
function muscleLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
</script>

<template>
  <aside
    class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
    data-testid="workout-plan-summary"
  >
    <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
      Plan summary
    </h3>
    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
      Computed live from the blocks in their current order. Recomputes on every add, edit, remove, or reorder.
    </p>

    <div class="mt-4 flex flex-col gap-1 border-t border-slate-200 dark:border-slate-700 pt-4">
      <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Total duration
      </h4>
      <div class="flex items-baseline justify-between gap-2" data-testid="workout-plan-summary-duration">
        <span class="text-2xl font-bold text-slate-900 dark:text-slate-100" style="font-variant-numeric: tabular-nums">{{ summary.totalDuration }}</span>
        <span class="text-sm text-slate-500 dark:text-slate-400">min timed · {{ summary.blockCount }} {{ pluralize(summary.blockCount, 'block') }}</span>
      </div>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Sum of blocks that carry a duration (warm-up, cardio, cooldown). Strength blocks are counted but not timed.
      </p>
    </div>

    <div class="mt-4 flex flex-col gap-1 border-t border-slate-200 dark:border-slate-700 pt-4">
      <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Intensity profile
      </h4>
      <div v-if="summary.profile.length" class="flex flex-col gap-1.5 text-sm" data-testid="workout-plan-summary-profile">
        <div v-for="row in summary.profile" :key="row.branchKey" class="flex items-center justify-between gap-2">
          <span class="text-slate-500 dark:text-slate-400">{{ row.label }}</span>
          <span class="flex items-center gap-2">
            <span v-if="row.dots" class="inline-flex gap-1">
              <span
                v-for="(dot, dotIndex) in row.dots"
                :key="dotIndex"
                class="h-2 w-2 rounded-full"
                :class="DOT_COLOR_CLASSES[dot]"
              />
            </span>
            <span class="text-slate-700 dark:text-slate-300" style="font-variant-numeric: tabular-nums">
              {{ row.count }} {{ pluralize(row.count, 'block') }}<template v-if="row.intensity"> · {{ row.intensity }}</template>
            </span>
          </span>
        </div>
      </div>
      <p v-else class="text-sm italic text-slate-400 dark:text-slate-500" data-testid="workout-plan-summary-profile-empty">
        Add a block to see its intensity profile.
      </p>
    </div>

    <div class="mt-4 flex flex-col gap-2 border-t border-slate-200 dark:border-slate-700 pt-4">
      <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Muscle coverage
      </h4>
      <div class="flex flex-wrap items-center gap-1.5" data-testid="workout-plan-summary-muscles">
        <span
          v-for="muscle in summary.muscleGroups"
          :key="muscle"
          class="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {{ muscleLabel(muscle) }}
        </span>
        <span
          v-if="!summary.muscleGroups.length"
          class="text-xs italic text-slate-400 dark:text-slate-500"
          data-testid="workout-plan-summary-muscles-empty"
        >
          No strength blocks yet
        </span>
      </div>
    </div>

    <div class="mt-4 flex flex-col gap-2 border-t border-slate-200 dark:border-slate-700 pt-4">
      <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Convention checks
      </h4>
      <div class="flex flex-col gap-1.5" data-testid="workout-plan-summary-violations">
        <div
          v-if="!summary.violations.length"
          class="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200"
          data-testid="workout-plan-summary-violations-clean"
        >
          All five ordering conventions satisfied
        </div>
        <div
          v-for="(violation, violationIndex) in summary.violations"
          :key="`${violation.rule}-${violationIndex}`"
          class="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
          data-testid="workout-plan-summary-violation"
        >
          <p>
            <strong>{{ violation.label }}.</strong>
            {{ violation.reason }}
          </p>
          <p class="mt-1.5 flex flex-wrap gap-1">
            <span
              v-for="position in violation.positions"
              :key="position"
              class="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300"
            >
              block {{ position }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>
