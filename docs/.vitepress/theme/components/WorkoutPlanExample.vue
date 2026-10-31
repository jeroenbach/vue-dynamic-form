<script lang="ts" setup>
import type { WorkoutBranchShape } from './workoutPlanMath';
import type { Metadata } from './WorkoutPlanTemplate.vue';
import { DynamicForm, removeNullValues, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { computed, ref } from 'vue';
import { collectBlocks, summarizePlan } from './workoutPlanMath';
import WorkoutPlanSummary from './WorkoutPlanSummary.vue';
import WorkoutPlanTemplate from './WorkoutPlanTemplate.vue';

export interface WorkoutPlanValues {
  plan?: {
    warmUp?: { order?: number, duration?: string }[]
    strength?: { order?: number, name?: string, muscle?: string, type?: string, sets?: string, reps?: string }[]
    cardio?: { order?: number, kind?: string, intensity?: string, duration?: string }[]
    cooldown?: { order?: number, duration?: string }[]
  }
}

// #region constants
// The shared choice budget: every block type draws from this one pool, so the count tag and the
// "every add button disables" behavior are a single, simple cap rather than four separate ones.
const PLAN_MAX_OCCURS = 12;

const MUSCLE_GROUPS = [
  { key: 'legs', value: 'Legs' },
  { key: 'chest', value: 'Chest' },
  { key: 'back', value: 'Back' },
  { key: 'shoulders', value: 'Shoulders' },
  { key: 'arms', value: 'Arms' },
  { key: 'core', value: 'Core' },
];

const CARDIO_TYPES = [
  { key: 'rowing', value: 'Rowing' },
  { key: 'running', value: 'Running' },
  { key: 'cycling', value: 'Cycling' },
  { key: 'elliptical', value: 'Elliptical' },
  { key: 'jumpRope', value: 'Jump rope' },
];

const MOVEMENT_TYPES = [
  { key: 'compound', value: 'Compound' },
  { key: 'isolation', value: 'Isolation' },
];

const INTENSITY_LEVELS = [
  { key: 'low', value: 'Low' },
  { key: 'moderate', value: 'Moderate' },
  { key: 'high', value: 'High' },
];

// The four branches the summary rail reads across, in the plan choice's own declaration order.
const BRANCHES: WorkoutBranchShape[] = [
  { name: 'warmUp' },
  { name: 'strength' },
  { name: 'cardio' },
  { name: 'cooldown' },
];

// A single positive-integer restriction, shared by every duration/sets/reps field: zero and
// negative values are never a meaningful workout number.
const POSITIVE_NUMBER_RESTRICTION = { minInclusive: 1 };

const MESSAGES = {
  required: '{field} is required',
  minInclusive: '{field} must be at least {min}',
};

// A realistic starting plan, not a blank form: a warm-up, three strength exercises, two cardio
// blocks and a cooldown, arranged so every one of the plan's ordering conventions is one reorder
// away from firing without any of them firing yet. Every numeric leaf is seeded as a string
// (matching what an <input type="number"> actually stores once touched), and every occurrence
// carries its own explicit `order` so this interleaved sequence survives the engine's own
// grouped-by-branch rendering.
const INITIAL_PLAN_VALUES: WorkoutPlanValues = {
  plan: {
    warmUp: [
      { order: 1, duration: '10' },
    ],
    cardio: [
      { order: 2, kind: 'rowing', intensity: 'high', duration: '15' },
      { order: 4, kind: 'jumpRope', intensity: 'high', duration: '12' },
    ],
    strength: [
      { order: 3, name: 'Barbell back squat', muscle: 'legs', type: 'compound', sets: '4', reps: '6' },
      { order: 5, name: 'Bench press', muscle: 'chest', type: 'compound', sets: '4', reps: '8' },
      { order: 6, name: 'Seated leg curl', muscle: 'legs', type: 'isolation', sets: '3', reps: '12' },
    ],
    cooldown: [
      { order: 7, duration: '8' },
    ],
  },
};
// #endregion constants

const {
  values,
  meta,
  resetForm,
  handleSubmit,
} = useDynamicForm<WorkoutPlanValues>({
  initialValues: INITIAL_PLAN_VALUES,
});

const isSubmitting = ref(false);
const submitted = ref<WorkoutPlanValues>();

// The engine silently revalidates the choice and every occurrence beneath it whenever a field
// changes, so the aggregate stays fresh and can gate the save button on its own.
const canSubmit = computed(() => meta.value.valid);

// Reads the form's own reactive values directly, never a computedProps closure, so the rail
// recomputes on every add, edit, remove, or reorder with no extra wiring.
const summary = computed(() => summarizePlan(collectBlocks(values.plan, BRANCHES)));

// #region metadata
const metadata: Metadata[] = [
  {
    // #region plan-choice
    name: 'plan',
    type: 'block',
    fieldOptions: { label: 'Your plan' },
    description: 'Performed top to bottom. Reorder blocks with the up and down controls.',
    minOccurs: 0,
    maxOccurs: PLAN_MAX_OCCURS,
    explicitChoiceSelection: true,
    displayOrder: 'added',
    preserveOrder: true,
    // #endregion plan-choice
    // #region block-branches
    choice: [
      {
        name: 'warmUp',
        type: 'block',
        maxOccursTotal: 1,
        fieldOptions: { label: 'Warm-up' },
        children: [
          { name: 'duration', type: 'number', fieldOptions: { label: 'Duration' }, suffix: 'min', restriction: POSITIVE_NUMBER_RESTRICTION },
        ],
      },
      {
        name: 'strength',
        type: 'block',
        fieldOptions: { label: 'Strength exercise' },
        children: [
          { name: 'name', type: 'text', fullWidth: true, fieldOptions: { label: 'Exercise name' }, placeholder: 'e.g. Barbell back squat' },
          { name: 'muscle', type: 'select', fieldOptions: { label: 'Muscle group' }, options: MUSCLE_GROUPS, restriction: { enumeration: MUSCLE_GROUPS.map(option => option.key) } },
          { name: 'type', type: 'select', fieldOptions: { label: 'Movement type' }, options: MOVEMENT_TYPES, restriction: { enumeration: MOVEMENT_TYPES.map(option => option.key) } },
          { name: 'sets', type: 'number', fieldOptions: { label: 'Sets' }, restriction: POSITIVE_NUMBER_RESTRICTION },
          { name: 'reps', type: 'number', fieldOptions: { label: 'Reps' }, restriction: POSITIVE_NUMBER_RESTRICTION },
        ],
      },
      {
        name: 'cardio',
        type: 'block',
        fieldOptions: { label: 'Cardio' },
        children: [
          { name: 'kind', type: 'select', fieldOptions: { label: 'Type' }, options: CARDIO_TYPES, restriction: { enumeration: CARDIO_TYPES.map(option => option.key) } },
          { name: 'intensity', type: 'select', fieldOptions: { label: 'Intensity' }, options: INTENSITY_LEVELS, restriction: { enumeration: INTENSITY_LEVELS.map(option => option.key) } },
          { name: 'duration', type: 'number', fieldOptions: { label: 'Duration' }, suffix: 'min', restriction: POSITIVE_NUMBER_RESTRICTION },
        ],
      },
      {
        name: 'cooldown',
        type: 'block',
        maxOccursTotal: 1,
        fieldOptions: { label: 'Cooldown / stretch' },
        children: [
          { name: 'duration', type: 'number', fieldOptions: { label: 'Duration' }, suffix: 'min', restriction: POSITIVE_NUMBER_RESTRICTION },
        ],
      },
    ],
    // #endregion block-branches
  },
];
// #endregion metadata

const onSubmit = handleSubmit(() => savePlan());

async function savePlan() {
  // The button disables while saving, but an Enter-key submit can still fire.
  if (isSubmitting.value)
    return;
  isSubmitting.value = true;
  await new Promise(resolve => setTimeout(resolve, 600));
  submitted.value = removeNullValues(values);
  isSubmitting.value = false;
}

function buildAnotherPlan() {
  resetForm();
  submitted.value = undefined;
}
</script>

<template>
  <div class="form-demo workout-layout">
    <form class="flex flex-col gap-6" @submit="onSubmit">
      <DynamicForm :template="WorkoutPlanTemplate" :metadata :settings="{ messages: MESSAGES }" />

      <div v-if="!submitted" class="flex flex-col gap-3">
        <button
          type="submit"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors cursor-pointer hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canSubmit || isSubmitting"
          data-testid="save-plan-button"
        >
          <span v-if="isSubmitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {{ isSubmitting ? 'Saving…' : 'Save plan' }}
        </button>
      </div>

      <div
        v-else
        class="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4 text-sm text-emerald-900 dark:text-emerald-200"
        data-testid="plan-saved-banner"
      >
        <span>✅</span>
        <span>
          <strong>Plan saved.</strong>
          Nothing is sent anywhere; this demo keeps everything in memory.
          <button type="button" class="ml-2 underline cursor-pointer hover:no-underline" @click="buildAnotherPlan">
            Build another plan
          </button>
        </span>
      </div>

      <pre
        v-if="!submitted"
        class="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg text-sm overflow-auto"
      >
IsDirty: {{ meta.dirty }}
Touched: {{ meta.touched }}
Valid: {{ meta.valid }}

// form values:
{{ JSON.stringify(values, null, 2) }}
      </pre>
    </form>

    <WorkoutPlanSummary class="summary-rail" :summary="summary" />
  </div>
</template>

<style scoped>
.workout-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

.summary-rail {
  position: sticky;
  top: 24px;
}

@media (max-width: 1023px) {
  .workout-layout {
    grid-template-columns: 1fr;
  }

  .summary-rail {
    position: static;
    order: -1;
  }
}
</style>
