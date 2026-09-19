<script lang="ts" setup>
import type { AppIconName } from './AppIcon.vue';
import type { Props as SectionCardProps } from './SectionCard.vue';
import { computed } from 'vue';
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

/**
 * Section card for a single (`maxOccurs: 1`) choice: pick exactly one branch via click-to-select
 * cards. Its repeatable counterpart is `ChoiceArraySectionCard` (per-branch Add buttons for
 * `maxOccurs > 1` choices, rendered through the `-choice-array` slot family).
 */
export interface Props extends /* @vue-ignore */ SectionCardProps {
  options?: ChoiceOption[]
  dataTestid?: string
  /** The choice's currently active occurrences, from the `-choice` slot's `activeChoiceOccurrences`. */
  activeChoiceOccurrences?: ActiveChoiceOccurrence[]
  /** Marks a branch active, deselecting any previously active one. */
  addChoiceOccurrence?: (branchKey: string) => void
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
</script>

<template>
  <SectionCard v-bind="$props">
    <div
      v-if="options?.length"
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

    <slot :selectedOption />
  </SectionCard>
</template>
