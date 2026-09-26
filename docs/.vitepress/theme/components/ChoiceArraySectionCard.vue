<script lang="ts" setup>
import type { ChoiceOption } from './ChoiceSectionCard.vue';
import type { Props as SectionCardProps } from './SectionCard.vue';
import { computed } from 'vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';
import SectionCard from './SectionCard.vue';

/**
 * Section card for a repeatable (`maxOccurs > 1`) choice, rendered through the `-choice-array`
 * slot family: one Add button per branch, each disabled once that branch's own limit or the
 * choice's shared occurrence budget is exhausted. The active occurrences themselves render in the
 * default slot via the `-choice-array-item` slots. Its single-select counterpart is
 * `ChoiceSectionCard` (click-to-select cards for `maxOccurs: 1` choices).
 */
export interface Props extends /* @vue-ignore */ SectionCardProps {
  options?: ChoiceOption[]
  dataTestid?: string
  /** Adds one occurrence of a branch. */
  addChoiceOccurrence?: (branchKey: string) => void
  /** Per-branch "may add" guard, used to disable a branch's Add button. */
  canAddChoiceOccurrence?: (branchKey: string) => boolean
  /** Choice slots consumed so far, in choice-occurrence units. Renders as the card's count tag alongside maxOccurs. */
  usedChoiceOccurrences?: number
  /** The choice's own maxOccurs, shown as the total in the count tag. */
  maxOccurs?: number
}

const props = defineProps<Props>();

const countTag = computed(() =>
  props.maxOccurs !== undefined ? `${props.usedChoiceOccurrences ?? 0} of ${props.maxOccurs}` : undefined);

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
  <SectionCard v-bind="$props" :tag="countTag">
    <!--
      A disabled button exposes its reason as visible helper text tied to it through
      aria-describedby, rather than only a `title` tooltip (not reliably announced by screen
      readers, nor reachable by keyboard).
    -->
    <div v-if="options?.length" class="md:col-span-2 flex flex-wrap gap-4">
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

    <slot />
  </SectionCard>
</template>
