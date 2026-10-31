<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { ChoiceOption } from './ChoiceSectionCard.vue';
import type { ProgramBranchShape } from './runOfShowMath';
import { computed } from 'vue';
import ChoiceArraySectionCard from './ChoiceArraySectionCard.vue';

/**
 * The program container: the add-item toolbar and the choice-level budget tag (via
 * `ChoiceArraySectionCard`) and the rail chrome around the rows. The rows themselves render
 * through the default slot, one `RunOfShowRow` per active occurrence.
 *
 * Takes the resolved branch shapes and its own path as plain data, not the raw templated
 * `FieldMetadata` object: see `SplitPaymentLedger`'s own note on why.
 */
export interface Props {
  programPath: string
  branches: ProgramBranchShape[]
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  errorMessage?: string
  dataTestid?: string
  options?: ChoiceOption[]
  addChoiceOccurrence?: (branchKey: string) => void
  canAddChoiceOccurrence?: (branchKey: string) => boolean
  usedChoiceOccurrences?: number
  maxOccurs?: number
  /**
   * This component renders two sibling cards (the add toolbar, the timeline), so Vue cannot
   * fall through a `v-show` bound on its own tag onto either root automatically; the caller
   * passes `hide` as a plain prop instead and both roots apply it themselves.
   */
  hide?: boolean
}

const props = defineProps<Props>();

// Whether any occurrence exists is a cheap presence check, not the full timeline math: the
// container only needs to decide between the dashed empty state and the row rail, the per-row
// clock chip is each row's own concern.
const hasOccurrences = computed(() => (props.usedChoiceOccurrences ?? 0) > 0);
</script>

<template>
  <!-- #region timeline-container -->
  <ChoiceArraySectionCard
    v-show="!hide"
    id="add-toolbar"
    :label
    :description
    :error-message="errorMessage"
    :dataTestid
    :options
    :addChoiceOccurrence
    :canAddChoiceOccurrence
    :usedChoiceOccurrences
    :maxOccurs
  />

  <section v-show="!hide" id="program-timeline" class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
    <div
      v-if="!hasOccurrences"
      id="empty-program"
      class="flex items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400"
      :data-testid="dataTestid ? `${dataTestid}-empty` : undefined"
    >
      No items yet. Use Add above to build the evening's program.
    </div>
    <div v-else class="timeline flex flex-col">
      <slot />
    </div>
  </section>
  <!-- #endregion timeline-container -->
</template>

<style scoped>
/* The rail: a vertical line behind the per-kind icon nodes, connecting consecutive rows. Lives
   here (not on the row itself) because only the container knows which row is last.
   Carried over from the cancelled FEAT-007 timeline design. */
.timeline :deep(.tl-row)::before {
  content: '';
  position: absolute;
  left: 21px;
  top: 6px;
  bottom: -14px;
  width: 2px;
  background: var(--vp-c-divider);
}

.timeline :deep(.tl-row:last-of-type)::before {
  display: none;
}
</style>
