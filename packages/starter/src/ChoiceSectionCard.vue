<script lang="ts" setup>
import type { StarterIconName } from '@/icons';
import type { Props as SectionCardProps } from '@/SectionCard.vue';
import { computed, toValue } from 'vue';
import ChoiceCard from '@/ChoiceCard.vue';
import SectionCard from '@/SectionCard.vue';
import StarterIcon from '@/StarterIcon.vue';

export interface ChoiceOption {
  value: string
  title?: string
  description?: string
  icon?: StarterIconName
}

/**
 * An active branch occurrence, as reported by the `-choice` slot's `activeChoiceOccurrences`
 * (`@bach.software/vue-dynamic-form`'s `ChoiceOccurrence`). Declared locally rather than imported:
 * the shape is not re-exported from the package's main entry point, so a consumer mirrors it instead.
 */
export interface ActiveChoiceOccurrence {
  branchKey: string
  index: number
}

/**
 * Section card for a single (`maxOccurs: 1`) choice: pick exactly one branch via click-to-select
 * cards. Its repeatable counterpart is `ChoiceArraySectionCard` (per-branch Add buttons for
 * `maxOccurs > 1` choices).
 */
export interface Props extends /* @vue-ignore */ SectionCardProps {
  options?: ChoiceOption[]
  dataTestid?: string
  /** The choice's currently active occurrences. */
  activeChoiceOccurrences?: ActiveChoiceOccurrence[]
  /** Marks a branch active, deselecting any previously active one. */
  addChoiceOccurrence?: (branchKey: string) => void
}

const props = defineProps<Props>();

const gridCols = computed(() => ((props.options?.length ?? 0) > 1 ? 'cols-2' : ''));

/**
 * Derived from the engine's own `activeChoiceOccurrences`, not local component state, so an
 * explicit-mode choice can start unselected. Kept for backward compatibility with the
 * `v-slot="{ selectedOption }"` contract; no current docs example reads it.
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
      class="sft-choice-grid"
      :class="gridCols"
      role="radiogroup"
      :aria-label="toValue(props.label) ?? 'Choose an option'"
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
          <StarterIcon :name="option.icon" />
        </template>
      </ChoiceCard>
    </div>

    <slot :selectedOption />
  </SectionCard>
</template>
