<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import { useFormContext } from 'vee-validate';
import { computed, toValue } from 'vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';
import { collectRules, findUnreachableRules, planReorderSwap } from './inboxRoutingMath';

/**
 * One rule occurrence: its position badge with up/down reorder, a kind label, its own condition
 * fields and action block (both rendered through the default slot), a remove button, and the
 * amber unreachable badge when an earlier same-type rule already catches everything this one would.
 */
export interface Props {
  path: string
  rulesPath: string
  branchKey: string
  globalIndex: number
  label?: MaybeRefOrGetter<string | undefined>
  canRemove?: boolean
}

const props = defineProps<Props>();

defineEmits<{
  remove: []
}>();

const kindLabel = computed(() => toValue(props.label) ?? props.branchKey);

const { values, setFieldValue } = useFormContext();

// My own occurrence key, e.g. 'subjectContains[2]', derived from my own path's last two segments
// rather than from branchKey + a locally-tracked index, since this row only ever knows its own
// rendered position within its branch array via the path the engine already gave it.
const myKey = computed(() => {
  const match = props.path.match(/([^.[\]]+)\[(\d+)\]$/);
  return match ? `${match[1]}[${match[2]}]` : props.path;
});

// #region reorder-plan
const rules = computed(() => collectRules((values as { rules?: unknown }).rules));

const upSwap = computed(() => planReorderSwap(rules.value, myKey.value, 'up'));
const downSwap = computed(() => planReorderSwap(rules.value, myKey.value, 'down'));
// #endregion reorder-plan

// #region unreachable-badge
// A dead rule is not invalid data: this is a derived display flag only, never a validation
// vehicle, so it never touches meta.valid or the submit gate.
const unreachableBy = computed(() => findUnreachableRules(rules.value).get(myKey.value));
const isUnreachable = computed(() => unreachableBy.value !== undefined);
// The subsuming rule's own displayed position, e.g. "rule 3", read off the same order-sorted
// list the badge text names. When more than one earlier rule could subsume this one,
// findUnreachableRules already picked the earliest, so there is only ever one to resolve here.
const subsumingDisplayPosition = computed(() => {
  const subsumingKey = unreachableBy.value;
  if (!subsumingKey)
    return undefined;
  const index = rules.value.findIndex(rule => rule.key === subsumingKey);
  return index === -1 ? undefined : index + 1;
});
// #endregion unreachable-badge

function applySwap(swap: ReturnType<typeof planReorderSwap>) {
  if (!swap)
    return;
  for (const write of swap)
    setFieldValue(`${props.rulesPath}.${write.key}.order`, write.order, false);
}
</script>

<template>
  <article
    class="rounded-xl border bg-white dark:bg-slate-900 p-4 flex flex-wrap items-start gap-4"
    :class="isUnreachable ? 'border-amber-300 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700'"
    :data-testid="path"
  >
    <div class="flex shrink-0 flex-col items-center gap-2">
      <span class="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
        {{ globalIndex + 1 }}
      </span>
      <div class="flex gap-1">
        <AppButton
          variant="ghost"
          :disabled="!upSwap"
          :aria-label="`Move ${kindLabel} rule up`"
          :dataTestid="`${path}-move-up`"
          @click="applySwap(upSwap)"
        >
          <AppIcon name="chevronUp" />
        </AppButton>
        <AppButton
          variant="ghost"
          :disabled="!downSwap"
          :aria-label="`Move ${kindLabel} rule down`"
          :dataTestid="`${path}-move-down`"
          @click="applySwap(downSwap)"
        >
          <AppIcon name="chevronDown" />
        </AppButton>
      </div>
    </div>

    <div class="min-w-[220px] flex-1 basis-[280px]">
      <p class="text-xs font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400 mb-2">
        {{ kindLabel }}
      </p>

      <p
        v-if="branchKey === 'hasAttachment'"
        class="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm text-slate-500 dark:text-slate-400"
      >
        📎 No filter to configure. This rule matches any message that carries an attachment.
      </p>

      <div class="flex flex-wrap gap-3">
        <slot />
      </div>

      <p
        v-if="isUnreachable"
        class="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-2.5 py-1.5 text-xs text-amber-800 dark:text-amber-200"
        :data-testid="`${path}-unreachable-badge`"
      >
        ⚠ Unreachable: rule {{ subsumingDisplayPosition }} already catches every message this rule would.
      </p>
    </div>

    <AppButton
      variant="danger-light"
      class="shrink-0"
      :disabled="!canRemove"
      :aria-label="`Remove ${kindLabel} rule`"
      :dataTestid="`${path}-remove-button`"
      @click="$emit('remove')"
    >
      <AppIcon name="bin" />
    </AppButton>
  </article>
</template>
