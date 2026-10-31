<script lang="ts" setup>
import type { RoutedMail } from './inboxRoutingMath';
import { destinationLabel } from './inboxRoutingMath';

/**
 * The sticky inbox rail: shows the six fixed demo messages and, for each, the rule that caught
 * it or a muted "no match" note. Takes the already-routed data as a prop, the same way
 * OrderSummary takes host-computed props rather than reading the form itself.
 */
export interface Props {
  routedInbox: RoutedMail[]
}

defineProps<Props>();
</script>

<template>
  <aside class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm sticky top-6" data-testid="test-inbox-panel">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
      Test inbox
    </h3>
    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
      6 fixed demo messages, routed by the rules in their current order. Recomputes live on every add, edit, remove, or reorder.
    </p>

    <ul class="mt-4 flex flex-col gap-3">
      <li
        v-for="entry in routedInbox"
        :key="entry.mail.key"
        class="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-sm"
        :data-testid="`test-inbox-${entry.mail.key}`"
      >
        <p class="font-medium text-slate-800 dark:text-slate-200 truncate">
          {{ entry.mail.from }}
        </p>
        <p class="text-slate-600 dark:text-slate-300 truncate">
          {{ entry.mail.subject }}
        </p>
        <p class="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{{ entry.mail.sizeLabel }}</span>
          <span v-if="entry.mail.hasAttachment" class="inline-flex items-center gap-1">
            📎 attachment
          </span>
        </p>

        <!-- #region routed-badge -->
        <p
          v-if="entry.rule"
          class="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
          :data-testid="`test-inbox-${entry.mail.key}-matched`"
        >
          &rarr; {{ destinationLabel(entry.rule) }}
          <span class="text-emerald-500 dark:text-emerald-400">rule {{ entry.ruleDisplayPosition }}</span>
        </p>
        <p
          v-else
          class="mt-2 inline-flex items-center rounded-full border border-dashed border-slate-300 dark:border-slate-600 px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400"
          :data-testid="`test-inbox-${entry.mail.key}-nomatch`"
        >
          No rule matched, stays in Inbox
        </p>
        <!-- #endregion routed-badge -->
      </li>
    </ul>
  </aside>
</template>
