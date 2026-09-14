<script lang="ts" setup>
import type { AppIconName } from './AppIcon.vue';
import type { Props as SectionCardProps } from './SectionCard.vue';
import { computed } from 'vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';
import ChoiceCard from './ChoiceCard.vue';
import SectionCard from './SectionCard.vue';

export interface ChoiceOption {
  value: string
  title?: string
  description?: string
  icon?: AppIconName
}

/**
 * An active branch occurrence, as reported by the `-choice` slot's `activeChoiceOccurrences`
 * (`@bach.software/vue-dynamic-form`'s `ChoiceOccurrence`). Declared locally rather than imported:
 * the type is not (yet) re-exported from the package's main entry point (only from
 * `DynamicFormTemplate.vue`'s own slot typing), so a docs consumer mirrors the shape instead.
 */
export interface ActiveChoiceOccurrence {
  branchKey: string
  index: number
}

export interface Props extends /* @vue-ignore */ SectionCardProps {
  options?: ChoiceOption[]
  dataTestid?: string
  /**
   * Set when the underlying choice's `maxOccurs > 1` (an "add one of several kinds" choice)
   * rather than "pick exactly one". Switches the widget from click-to-select cards to a
   * per-branch Add-button row, driven by the same primitives. Not exercised by any docs example
   * yet, kept so this shared component is ready for a repeatable consumer without a second
   * rewrite (the onboarding planner's `launchApproach` choice stays `maxOccurs: 1`).
   */
  repeatable?: boolean
  /** The choice's currently active occurrences, from the `-choice` slot's `activeChoiceOccurrences`. */
  activeChoiceOccurrences?: ActiveChoiceOccurrence[]
  /** Marks a branch active (`maxOccurs: 1`) or adds one occurrence of it (`maxOccurs > 1`). */
  addChoiceOccurrence?: (branchKey: string) => void
  /** Removes a previously added occurrence, or deselects the active branch. Not called by this component yet (no occurrence list is rendered here); accepted so the full contract is available to a future repeatable consumer. */
  removeChoiceOccurrence?: (branchKey: string, index?: number) => void
  /** Per-branch "may add" guard, used to disable a branch's Add button in repeatable mode. */
  canAddChoiceOccurrence?: (branchKey: string) => boolean
}

const props = defineProps<Props>();

const gridCols = computed(() => {
  const n = props.options?.length ?? 0;
  if (n % 3 === 0)
    return 'md:grid-cols-3';
  if (n % 2 === 0)
    return 'md:grid-cols-2';
  return 'md:grid-cols-1';
});

/**
 * Derived from the engine's own `activeChoiceOccurrences`, not local component state. This is
 * what lets an explicit-mode choice start unselected: there is no more default-to-first-option
 * local ref. Kept for backward compatibility with the `v-slot="{ selectedOption }"` contract; no
 * current docs example reads it, but any future one gets the real, engine-derived selection.
 */
const selectedOption = computed(() => props.activeChoiceOccurrences?.[0]?.branchKey);

function isActive(value: string): boolean {
  return props.activeChoiceOccurrences?.some(occurrence => occurrence.branchKey === value) ?? false;
}

function canAdd(value: string): boolean {
  return props.canAddChoiceOccurrence ? props.canAddChoiceOccurrence(value) : true;
}

function addOptionReasonId(value: string): string | undefined {
  return dataTestidFor(value) ? `${dataTestidFor(value)}-reason` : undefined;
}

function dataTestidFor(value: string): string | undefined {
  return props.dataTestid ? `${props.dataTestid}-add-${value}` : undefined;
}
</script>

<template>
  <SectionCard v-bind="$props">
    <div
      v-if="options?.length && !repeatable"
      class="grid grid-cols-1 gap-3 md:col-span-2"
      :class="gridCols"
      role="radiogroup"
      :aria-label="label ?? 'Choose an option'"
    >
      <ChoiceCard
        v-for="option in options"
        :key="option.value"
        :dataTestid="dataTestid ? `${dataTestid}-${option.value}` : undefined"
        :title="option.title"
        :description="option.description"
        :selected="isActive(option.value)"
        @select="addChoiceOccurrence?.(option.value)"
      >
        <template v-if="option.icon" #icon>
          <AppIcon :name="option.icon" />
        </template>
      </ChoiceCard>
    </div>

    <!--
      Repeatable mode (maxOccurs > 1): one Add button per branch instead of click-to-select
      cards. A disabled button exposes its reason as visible helper text tied to it through
      aria-describedby, rather than only a `title` tooltip (not reliably announced by screen
      readers, nor reachable by keyboard).
    -->
    <div v-else-if="options?.length && repeatable" class="md:col-span-2 flex flex-wrap gap-4">
      <div v-for="option in options" :key="option.value" class="flex flex-col gap-1">
        <AppButton
          :disabled="!canAdd(option.value)"
          :dataTestid="dataTestidFor(option.value)"
          :aria-describedby="!canAdd(option.value) ? addOptionReasonId(option.value) : undefined"
          @click="addChoiceOccurrence?.(option.value)"
        >
          <AppIcon name="plus" />
          Add {{ option.title ?? option.value }}
        </AppButton>
        <p
          v-if="!canAdd(option.value)"
          :id="addOptionReasonId(option.value)"
          class="text-xs text-slate-500 dark:text-slate-400"
        >
          The limit for {{ option.title ?? option.value }} has been reached.
        </p>
      </div>
    </div>

    <slot :selectedOption />
  </SectionCard>
</template>
