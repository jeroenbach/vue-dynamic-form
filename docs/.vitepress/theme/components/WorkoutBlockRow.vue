<script lang="ts" setup>
import type { WorkoutBranchShape } from './workoutPlanMath';
import { useFormContext } from 'vee-validate';
import { computed } from 'vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';
import { checkConventions, collectBlocks, readPath } from './workoutPlanMath';

/**
 * One block in the workout plan: a position badge, an up/down reorder control, the branch's own
 * fields (rendered through the default slot), and a remove button. Reordering writes the two
 * affected occurrences' `order` values directly off the form context, the same technique
 * SplitPaymentLedgerRow uses, so no plumbing beyond the row's own path and its parent choice's
 * path is needed.
 *
 * Also derives its own ordering-convention warnings straight from the form context, the same way
 * SplitPaymentLedgerRow derives its own incomplete-coverage state, rather than receiving them as
 * a prop from the rail.
 */
export interface Props {
  path: string
  planPath: string
  branches: WorkoutBranchShape[]
  branchKey: string
  index: number
  globalIndex: number
  canRemove?: boolean
}

const props = defineProps<Props>();

defineEmits<{
  remove: []
}>();

const BLOCK_KIND_LABELS: Record<string, string> = {
  warmUp: '🔥 Warm-up',
  strength: '🏋️ Strength exercise',
  cardio: '🚴 Cardio',
  cooldown: '🧘 Cooldown / stretch',
};

const kindLabel = computed(() => BLOCK_KIND_LABELS[props.branchKey] ?? props.branchKey);

const { values, setFieldValue } = useFormContext();

const blocks = computed(() => collectBlocks(readPath(values, props.planPath), props.branches));

const myKey = computed(() => `${props.branchKey}[${props.index}]`);
const myBlock = computed(() => blocks.value.find(block => block.key === myKey.value));
const myOrder = computed(() => myBlock.value?.order ?? props.globalIndex + 1);

const myViolations = computed(() =>
  checkConventions(blocks.value).filter(violation => violation.positions.includes(myOrder.value)));

// #region reorder-control
// A missing neighbor at order - 1 or order + 1 always means an actual boundary, never a gap,
// since the order sequence stays contiguous.
const upDisabled = computed(() => !blocks.value.some(block => block.order === myOrder.value - 1));
const downDisabled = computed(() => !blocks.value.some(block => block.order === myOrder.value + 1));

function moveUp() {
  const neighbor = blocks.value.find(block => block.order === myOrder.value - 1);
  if (!neighbor)
    return;
  setFieldValue(`${props.planPath}.${neighbor.key}.order`, myOrder.value, false);
  setFieldValue(`${props.path}.order`, myOrder.value - 1, false);
}

function moveDown() {
  const neighbor = blocks.value.find(block => block.order === myOrder.value + 1);
  if (!neighbor)
    return;
  setFieldValue(`${props.planPath}.${neighbor.key}.order`, myOrder.value, false);
  setFieldValue(`${props.path}.order`, myOrder.value + 1, false);
}
// #endregion reorder-control
</script>

<template>
  <article
    class="rounded-xl border bg-white dark:bg-slate-900 p-4 flex flex-wrap items-start gap-4"
    :class="myViolations.length ? 'border-amber-300 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700'"
    :data-testid="path"
  >
    <div class="flex shrink-0 flex-col items-center gap-2">
      <span class="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
        {{ globalIndex + 1 }}
      </span>
      <div class="flex gap-1">
        <AppButton
          variant="ghost"
          :disabled="upDisabled"
          :aria-label="`Move ${kindLabel} up`"
          :dataTestid="path ? `${path}-move-up` : undefined"
          @click="moveUp"
        >
          <AppIcon name="chevronUp" />
        </AppButton>
        <AppButton
          variant="ghost"
          :disabled="downDisabled"
          :aria-label="`Move ${kindLabel} down`"
          :dataTestid="path ? `${path}-move-down` : undefined"
          @click="moveDown"
        >
          <AppIcon name="chevronDown" />
        </AppButton>
      </div>
    </div>

    <div class="min-w-[220px] flex-1 basis-[260px]">
      <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {{ kindLabel }}
      </p>
      <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <slot />
      </div>
      <p
        v-for="(violation, violationIndex) in myViolations"
        :key="`${violation.rule}-${violationIndex}`"
        class="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200"
        data-testid="workout-block-row-violation-badge"
      >
        <span aria-hidden="true">⚠</span>
        {{ violation.label }}
      </p>
    </div>

    <AppButton
      variant="danger-light"
      class="shrink-0"
      :disabled="!canRemove"
      :aria-label="`Remove ${kindLabel}`"
      :dataTestid="path ? `${path}-remove-button` : undefined"
      @click="$emit('remove')"
    >
      <AppIcon name="bin" />
    </AppButton>
  </article>
</template>
