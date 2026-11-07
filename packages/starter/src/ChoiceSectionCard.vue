<script lang="ts" setup>
import type { StarterIconName } from '@/icons';
import type { Props as SectionCardProps } from '@/SectionCard.vue';
import { computed, toValue, useAttrs, watch } from 'vue';
import ChoiceCard from '@/ChoiceCard.vue';
import SectionCard from '@/SectionCard.vue';
import StarterIcon from '@/StarterIcon.vue';

export interface ChoiceOption {
  value: string
  title?: string
  description?: string
  icon?: StarterIconName
  /** Excludes this one card from arrow-key roving and from ever holding the group's single tabindex="0" seat. */
  disabled?: boolean
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
  /** Aria label of the radiogroup when no label is given. */
  ariaLabel?: string
  /** Grays out the option cards and blocks selection. */
  disabled?: boolean
  /** Deselects a branch; used below to clear the selection when the choice becomes disabled. */
  removeChoiceOccurrence?: (branchKey: string, index?: number) => void
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Choose an option',
});

// `errorMessage` is declared on SectionCardProps, not on this component's own runtime props
// (the SectionCardProps extension is type-only), so it reaches SectionCard through attrs
// fallthrough rather than through `props`. Reading it here lets the radiogroup itself carry
// aria-invalid, since the error text alone gives a screen reader no focusable, invalid target.
const attrs = useAttrs();
const hasError = computed(() => !!attrs.errorMessage);

// Without this, a branch picked before the choice was disabled would keep its value even
// though the user can no longer see or change it.
watch(() => props.disabled, (isDisabled) => {
  if (!isDisabled || !props.removeChoiceOccurrence)
    return;
  for (const occurrence of props.activeChoiceOccurrences ?? [])
    props.removeChoiceOccurrence(occurrence.branchKey, occurrence.index);
});

const gridCols = computed(() => {
  const n = props.options?.length ?? 0;
  if (n > 0 && n % 3 === 0)
    return 'cols-3';
  if (n > 0 && n % 2 === 0)
    return 'cols-2';
  return '';
});

/**
 * Derived from the engine's own `activeChoiceOccurrences`, not local component state, so an
 * explicit-mode choice can start unselected. Kept for backward compatibility with the
 * `v-slot="{ selectedOption }"` contract; no current docs example reads it.
 */
const selectedOption = computed(() => props.activeChoiceOccurrences?.[0]?.branchKey);

function isActive(value: string): boolean {
  return props.activeChoiceOccurrences?.some(occurrence => occurrence.branchKey === value) ?? false;
}

/** Cards that can receive focus: excludes the section-wide disabled state and each card's own. */
const enabledOptions = computed(() =>
  (props.options ?? []).filter(option => !(props.disabled || option.disabled)),
);

/**
 * The single card that carries tabindex="0": the selected enabled card, or the first enabled
 * one when nothing is selected yet. Every other card is -1 so the group is one Tab stop.
 */
const activeTabStopValue = computed(() => {
  const enabled = enabledOptions.value;
  if (!enabled.length)
    return undefined;
  const selected = enabled.find(option => isActive(option.value));
  return (selected ?? enabled[0]).value;
});

function tabIndexFor(value: string): number {
  return activeTabStopValue.value === value ? 0 : -1;
}

const cardRefs: Record<string, { $el: HTMLElement } | null> = {};
function setCardRef(value: string, el: unknown) {
  cardRefs[value] = el as { $el: HTMLElement } | null;
}

/**
 * Moves roving focus and selection among enabled cards, wrapping at both ends. Disabled
 * cards are never a landing spot because they are filtered out of `enabledOptions` up front.
 */
function onCardKeydown(event: KeyboardEvent, value: string, direction: 1 | -1) {
  const enabled = enabledOptions.value;
  const currentIndex = enabled.findIndex(option => option.value === value);
  if (currentIndex === -1)
    return;

  const next = enabled[(currentIndex + direction + enabled.length) % enabled.length];
  if (next.value === value)
    return;

  event.preventDefault();
  props.addChoiceOccurrence?.(next.value);
  cardRefs[next.value]?.$el?.focus();
}
</script>

<template>
  <SectionCard v-bind="$props">
    <div
      v-if="options?.length"
      class="sft-choice-grid"
      :class="gridCols"
      role="radiogroup"
      :aria-label="toValue(props.label) ?? ariaLabel"
      :aria-invalid="hasError ? true : undefined"
    >
      <ChoiceCard
        v-for="option in options"
        :key="option.value"
        :ref="(el: unknown) => setCardRef(option.value, el)"
        :dataTestid="dataTestid ? `${dataTestid}-${option.value}` : undefined"
        :title="option.title"
        :description="option.description"
        :selected="isActive(option.value)"
        :disabled="disabled || option.disabled"
        :tabindex="tabIndexFor(option.value)"
        @select="addChoiceOccurrence?.(option.value)"
        @keydown.right="onCardKeydown($event, option.value, 1)"
        @keydown.down="onCardKeydown($event, option.value, 1)"
        @keydown.left="onCardKeydown($event, option.value, -1)"
        @keydown.up="onCardKeydown($event, option.value, -1)"
      >
        <template v-if="option.icon" #icon>
          <StarterIcon :name="option.icon" />
        </template>
      </ChoiceCard>
    </div>

    <slot :selectedOption />
  </SectionCard>
</template>
