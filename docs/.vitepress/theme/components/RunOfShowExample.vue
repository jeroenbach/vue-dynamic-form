<script lang="ts" setup>
import type { Path } from 'vee-validate';
import type { ProgramBranchShape } from './runOfShowMath';
import type { DynamicFormSettings, Metadata } from './RunOfShowTemplate.vue';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { computed, ref } from 'vue';
import {
  collectProgramOccurrences,
  computeTimeline,
  countOccurrencesByKind,
  findCurfewBreaches,
  formatTime,
  liftToEventFrame,
  parseTime,
} from './runOfShowMath';
import RunOfShowSummary from './RunOfShowSummary.vue';
import RunOfShowTemplate from './RunOfShowTemplate.vue';

export interface RunOfShowFormValues {
  schedule?: {
    eventStart?: string
    curfew?: string
    venueClose?: string
  }
  program?: {
    speech?: { order?: number, speaker?: string, duration?: string, onMic?: boolean }[]
    dinner?: { order?: number, course?: string, duration?: string }[]
    band?: { order?: number, act?: string, duration?: string }[]
    dance?: { order?: number, duration?: string, musicStyle?: string }[]
    cake?: { order?: number, duration?: string, note?: string }[]
    break?: { order?: number, duration?: string }[]
  }
  curfewCheck?: never
}

// #region constants
// minOccurs: 0 keeps an empty program valid data (the dashed empty state); maxOccurs: 20 sizes
// the shared add-budget across every branch.
const PROGRAM_MIN_OCCURS = 0;
const PROGRAM_MAX_OCCURS = 20;

function durationOptions(minutesList: readonly number[]): { key: string, value: string }[] {
  return minutesList.map(minutes => ({ key: String(minutes), value: `${minutes} min` }));
}

const SPEECH_DURATIONS = [5, 10, 15, 20] as const;
const DINNER_DURATIONS = [30, 45, 60] as const;
const BAND_DURATIONS = [45, 60, 90, 120] as const;
const DANCE_DURATIONS = [60, 90, 120, 150] as const;
const CAKE_DURATIONS = [15] as const;
const BREAK_DURATIONS = [15, 30] as const;

const COURSE_OPTIONS = [
  { key: 'starter', value: 'Starter' },
  { key: 'main', value: 'Main' },
  { key: 'dessert', value: 'Dessert' },
];

const MESSAGES = {
  required: '{field} is required',
  minOccurs: 'At least {min} items required',
  choiceMinOccurs: 'The following fields need to occur at least {min} time(s): {field}',
};

// A brand-new occurrence with no value anywhere yet is treated by the engine as not worth
// requiring its own children for, so a reader can add a row without every field instantly
// showing invalid. That relaxation also silently lifts each row's own required checks (speaker,
// act, course, music style, duration) until some field in the row gets a value from elsewhere.
// Seeding the duration select, present on every branch, with an empty string the moment its
// occurrence first renders gives the occurrence a value right away without changing what the
// select shows (an empty string and no value both display the placeholder option), so every
// other field in the row validates as required from the start, exactly like a filled-in row.
function seedOccurrencePresence(_thisField: unknown, fieldValue: { value: unknown }): void {
  if (fieldValue.value === undefined)
    fieldValue.value = '';
}

// The amplified-ness of each branch, independent of its own fields; a speech is only amplified
// once its own `onMic` flag is on, read inside `collectProgramOccurrences` itself. Kept here, not
// derived from the metadata tree, because it is a one-line fact about the page's six branches,
// not something a reader ever configures.
const PROGRAM_BRANCHES: ProgramBranchShape[] = [
  { name: 'speech', amplifiedByDefault: false },
  { name: 'dinner', amplifiedByDefault: false },
  { name: 'band', amplifiedByDefault: true },
  { name: 'dance', amplifiedByDefault: true },
  { name: 'cake', amplifiedByDefault: false },
  { name: 'break', amplifiedByDefault: false },
];

// Mirrors each branch's own `fieldOptions.label` text below, kept as a small lookup so the
// curfew banner can name an offending item by its branch's display label without walking the
// metadata tree at render time.
const PROGRAM_BRANCH_LABELS: Record<string, string> = {
  speech: 'Speech / toast',
  dinner: 'Dinner course',
  band: 'Band / DJ set',
  dance: 'Open dance floor',
  cake: 'Cake cutting',
  break: 'Break / room turn',
};

// The count-chip row's own wording: singular/plural nouns per kind, since "1 band" / "2 bands"
// reads worse than "1 band set" / "2 band sets" for most of these branches.
const PROGRAM_COUNT_NOUNS: Record<string, { singular: string, plural: string }> = {
  speech: { singular: 'speech', plural: 'speeches' },
  dinner: { singular: 'dinner course', plural: 'dinner courses' },
  band: { singular: 'band set', plural: 'band sets' },
  dance: { singular: 'dance floor', plural: 'dance floors' },
  cake: { singular: 'cake', plural: 'cakes' },
  break: { singular: 'break', plural: 'breaks' },
};

function formatCountLabel(branchKey: string, count: number): string {
  const noun = PROGRAM_COUNT_NOUNS[branchKey];
  if (!noun)
    return `${count} ${branchKey}`;
  return `${count} ${count === 1 ? noun.singular : noun.plural}`;
}
// #endregion constants

const {
  values,
  meta,
  resetForm,
  validateField,
  handleSubmit,
} = useDynamicForm<RunOfShowFormValues>({
  // A wedding reception tuned so the curfew payoff is a genuine single reorder: the band set
  // (position 6) is the only item that ends after the 23:00 curfew, and moving it up once (past
  // the main course directly above it) brings its end back under the curfew with no field
  // edited. The open dance floor, the only other always-amplified branch, ends at 20:25, nowhere
  // near the curfew either before or after that move, so it never breaches on its own.
  initialValues: {
    schedule: { eventStart: '18:00', curfew: '23:00', venueClose: '01:00' },
    program: {
      speech: [{ order: 1, speaker: 'Father of the bride', duration: '10', onMic: true }],
      dinner: [
        { order: 2, course: 'starter', duration: '45' },
        { order: 5, course: 'main', duration: '60' },
      ],
      dance: [{ order: 3, duration: '90', musicStyle: 'Disco & pop' }],
      break: [{ order: 4, duration: '30' }],
      band: [{ order: 6, act: 'The Night Owls', duration: '120' }],
      cake: [{ order: 7, duration: '15', note: 'Sparklers from the staff' }],
    },
  },
});

// The clock cascade and the curfew check are both read live off the form's own values, never
// written back into them: durations in, clock times and a pass/fail out.
const occurrences = computed(() => collectProgramOccurrences(values.program, PROGRAM_BRANCHES));
const eventStartMinutes = computed(() => parseTime(values.schedule?.eventStart));
const timeline = computed(() => computeTimeline(occurrences.value, eventStartMinutes.value));
const curfewMinutes = computed(() => parseTime(values.schedule?.curfew));
const curfewBreachKeys = computed(() =>
  findCurfewBreaches(timeline.value, curfewMinutes.value, eventStartMinutes.value));

interface CurfewBreachSummary {
  key: string
  position: number
  label: string
  endTime: string
}

const curfewBreachSummaries = computed<CurfewBreachSummary[]>(() => {
  const entries = timeline.value.entries;
  return curfewBreachKeys.value
    .map((key) => {
      const index = entries.findIndex(entry => entry.key === key);
      const entry = entries[index];
      return {
        key,
        position: index + 1,
        label: PROGRAM_BRANCH_LABELS[entry?.branchKey ?? ''] ?? entry?.branchKey ?? '',
        endTime: entry ? formatTime(entry.endMinutes) : '',
      };
    })
    .sort((a, b) => a.position - b.position);
});

// The one message both the submit button's helper line and the hidden vehicle leaf's own
// validation read, so the two can never drift apart.
const curfewHelperMessage = computed(() => {
  if (curfewBreachSummaries.value.length === 0)
    return undefined;
  const positions = curfewBreachSummaries.value.map(breach => breach.position);
  const noun = positions.length === 1 ? 'position' : 'positions';
  return `Resolve the curfew violation on ${noun} ${positions.join(', ')} before saving.`;
});

function curfewValidation(): true | string {
  return curfewHelperMessage.value ?? true;
}

// The engine silently revalidates groups and choices whenever a field inside them changes, so the
// form-level aggregate stays fresh and can gate the submit button directly, with no
// formIsComplete-style workaround.
const canSubmit = computed(() => meta.value.valid);

// The at-a-glance timeline list: every item's label and computed start, with the same breach set
// the curfew banner already names tinting the matching row.
const summaryTimeline = computed(() => {
  const breaching = new Set(curfewBreachKeys.value);
  return timeline.value.entries.map(entry => ({
    key: entry.key,
    label: PROGRAM_BRANCH_LABELS[entry.branchKey] ?? entry.branchKey,
    startTime: formatTime(entry.startMinutes),
    isBreaching: breaching.has(entry.key),
  }));
});

// Venue-close overflow: a duration total, independent of the curfew and of item order. Lifted
// into the same minutes-since-event-start frame computeTimeline's endMinutes already use, the
// same rollover findCurfewBreaches already applies to the curfew anchor, so the two anchors never
// get compared across mismatched frames.
const venueCloseMinutes = computed(() => parseTime(values.schedule?.venueClose));
const venueCloseAbsolute = computed(() => liftToEventFrame(venueCloseMinutes.value, eventStartMinutes.value));
const venueOverflowMinutes = computed(() => timeline.value.programEndMinutes - venueCloseAbsolute.value);

const summaryCounts = computed(() =>
  countOccurrencesByKind(occurrences.value, PROGRAM_BRANCHES).map(count => ({
    branchKey: count.branchKey,
    text: formatCountLabel(count.branchKey, count.count),
  })));

const isSubmitting = ref(false);
const submitted = ref(false);

const itemCount = computed(() => occurrences.value.length);
const programSpanLabel = computed(() =>
  `${formatTime(eventStartMinutes.value)} to ${formatTime(timeline.value.programEndMinutes)}`);

const settings: DynamicFormSettings = {
  // The speaker field's required check (and every other field here) needs to fail the moment a
  // reader tabs away from an empty field, not wait for a later value change or submit attempt.
  validateOnBlur: true,
  messages: MESSAGES,
};

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'schedule',
    type: 'scheduleAnchors',
    fieldOptions: { label: 'Schedule anchors' },
    description: 'Three editable times. Change any one and every row\'s clock time and the curfew check recompute live, without touching the program\'s order or content.',
    children: [
      { name: 'eventStart', type: 'time', fieldOptions: { label: 'Event start' } },
      { name: 'curfew', type: 'time', fieldOptions: { label: 'Amplified-music curfew' } },
      { name: 'venueClose', type: 'time', fieldOptions: { label: 'Venue closes' } },
    ],
  },
  // #region program-choice
  {
    name: 'program',
    type: 'program',
    fieldOptions: { label: 'Program' },
    description: 'Add an item to the end of the list, then reorder with the arrows on each row.',
    minOccurs: PROGRAM_MIN_OCCURS,
    maxOccurs: PROGRAM_MAX_OCCURS,
    explicitChoiceSelection: true,
    // Both flags are required together: displayOrder: 'added' is what makes the engine's
    // renderedChoiceOccurrences sort at all, and preserveOrder: true is what gives the reorder
    // buttons a persisted `order` child to write to. Either alone leaves the up/down controls
    // writing data the render never reads.
    displayOrder: 'added',
    preserveOrder: true,
    choice: [
      {
        name: 'speech',
        type: 'program',
        fieldOptions: { label: 'Speech / toast' },
        children: [
          { name: 'speaker', fieldOptions: { label: 'Speaker' }, placeholder: 'e.g. Father of the bride' },
          {
            name: 'duration',
            type: 'select',
            fieldOptions: { label: 'Duration' },
            options: durationOptions(SPEECH_DURATIONS),
            restriction: { enumeration: SPEECH_DURATIONS.map(String) },
            computedProps: [seedOccurrencePresence],
          },
          { name: 'onMic', type: 'checkbox', minOccurs: 0, fieldOptions: { label: 'On the mic' } },
        ],
      },
      {
        name: 'dinner',
        type: 'program',
        fieldOptions: { label: 'Dinner course' },
        children: [
          {
            name: 'course',
            type: 'select',
            fieldOptions: { label: 'Course' },
            options: COURSE_OPTIONS,
            restriction: { enumeration: COURSE_OPTIONS.map(option => option.key) },
          },
          {
            name: 'duration',
            type: 'select',
            fieldOptions: { label: 'Duration' },
            options: durationOptions(DINNER_DURATIONS),
            restriction: { enumeration: DINNER_DURATIONS.map(String) },
            computedProps: [seedOccurrencePresence],
          },
        ],
      },
      {
        name: 'band',
        type: 'program',
        fieldOptions: { label: 'Band / DJ set' },
        description: 'Amplified by definition.',
        children: [
          { name: 'act', fieldOptions: { label: 'Act' }, placeholder: 'e.g. The Night Owls' },
          {
            name: 'duration',
            type: 'select',
            fieldOptions: { label: 'Duration' },
            options: durationOptions(BAND_DURATIONS),
            restriction: { enumeration: BAND_DURATIONS.map(String) },
            computedProps: [seedOccurrencePresence],
          },
        ],
      },
      {
        name: 'dance',
        type: 'program',
        fieldOptions: { label: 'Open dance floor' },
        description: 'Amplified by definition.',
        children: [
          {
            name: 'duration',
            type: 'select',
            fieldOptions: { label: 'Duration' },
            options: durationOptions(DANCE_DURATIONS),
            restriction: { enumeration: DANCE_DURATIONS.map(String) },
            computedProps: [seedOccurrencePresence],
          },
          { name: 'musicStyle', fieldOptions: { label: 'Music style' }, placeholder: 'e.g. Disco & pop' },
        ],
      },
      {
        name: 'cake',
        type: 'program',
        fieldOptions: { label: 'Cake cutting' },
        children: [
          // A single fixed option is intentional: cake cutting is a short, fixed-length ritual,
          // not a missing increment list.
          {
            name: 'duration',
            type: 'select',
            fieldOptions: { label: 'Duration' },
            options: durationOptions(CAKE_DURATIONS),
            restriction: { enumeration: CAKE_DURATIONS.map(String) },
            computedProps: [seedOccurrencePresence],
          },
          // Optional, and the only reason this branch is an object rather than a bare marker:
          // the ordered-choice reorder control needs every branch to carry a real child field.
          { name: 'note', minOccurs: 0, fieldOptions: { label: 'Note' }, placeholder: 'e.g. Sparklers from the staff' },
        ],
      },
      {
        name: 'break',
        type: 'program',
        fieldOptions: { label: 'Break / room turn' },
        children: [
          {
            name: 'duration',
            type: 'select',
            fieldOptions: { label: 'Duration' },
            options: durationOptions(BREAK_DURATIONS),
            restriction: { enumeration: BREAK_DURATIONS.map(String) },
            computedProps: [seedOccurrencePresence],
          },
        ],
      },
    ],
  },
  // #endregion program-choice
  {
    // Carries no value of its own: the only way it can fail is its own validation closure below,
    // which is also the sole source of the curfew helper line and the summary banner.
    name: 'curfewCheck',
    type: 'curfew',
    minOccurs: 0,
    validation: () => curfewValidation(),
    computedProps: [(thisField) => {
      // Reads every nested value here, not just the top-level key, so this recomputes whenever
      // any occurrence is added, removed, reordered, or edited, or any schedule anchor changes,
      // which is exactly when the curfew check needs to re-run.
      JSON.stringify(values.program);
      void values.schedule?.eventStart;
      void values.schedule?.curfew;
      void values.schedule?.venueClose;
      validateField(thisField.path as Path<RunOfShowFormValues>);
    }],
  },
];
// #endregion metadata

const onSubmit = handleSubmit(async () => {
  if (isSubmitting.value)
    return;
  isSubmitting.value = true;
  // Demo only: nothing is persisted anywhere.
  await new Promise(resolve => setTimeout(resolve, 900));
  submitted.value = true;
  isSubmitting.value = false;
});

function startNewProgram() {
  resetForm();
  submitted.value = false;
}
</script>

<template>
  <div class="form-demo run-of-show-layout">
    <form class="flex flex-col gap-4" @submit="onSubmit">
      <DynamicForm :template="RunOfShowTemplate" :metadata :settings />

      <div v-if="!submitted" class="flex flex-col gap-2">
        <button
          type="submit"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors cursor-pointer hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canSubmit || isSubmitting"
          data-testid="save-run-of-show-button"
        >
          <span v-if="isSubmitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {{ isSubmitting ? 'Saving…' : 'Save run of show' }}
        </button>
        <p
          v-if="!canSubmit && curfewHelperMessage"
          class="text-sm text-red-600 dark:text-rose-400"
          data-testid="save-run-of-show-helper"
        >
          {{ curfewHelperMessage }}
        </p>
      </div>

      <div
        v-else
        class="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4 text-sm text-emerald-900 dark:text-emerald-200"
        data-testid="run-of-show-success-banner"
      >
        <span>✅</span>
        <span>
          <strong>Run of show saved.</strong>
          {{ itemCount }} items, {{ programSpanLabel }}. (Demo only: nothing was stored.)
          <button type="button" class="ml-2 underline cursor-pointer hover:no-underline" @click="startNewProgram">
            Start a new program
          </button>
        </span>
      </div>

      <pre v-if="!submitted" class="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg text-sm overflow-auto">
IsDirty: {{ meta.dirty }}
Touched: {{ meta.touched }}
Valid: {{ meta.valid }}

// form values:
{{ JSON.stringify(values, null, 2) }}
      </pre>
    </form>

    <RunOfShowSummary
      class="summary-rail"
      :timeline="summaryTimeline"
      :programEndTime="formatTime(timeline.programEndMinutes)"
      :venueCloseTime="values.schedule?.venueClose ?? ''"
      :venueOverflowMinutes
      :counts="summaryCounts"
      :curfewBreaches="curfewBreachSummaries"
      :curfewTime="values.schedule?.curfew ?? ''"
    />
  </div>
</template>

<style scoped>
.run-of-show-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}

.summary-rail {
  position: sticky;
  top: 24px;
}

@media (max-width: 1100px) {
  .run-of-show-layout {
    grid-template-columns: 1fr;
  }

  .summary-rail {
    order: -1;
    position: static;
  }
}
</style>
