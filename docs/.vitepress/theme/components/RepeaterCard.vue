<script setup lang="ts">
import type { MaybeRefOrGetter } from 'vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';

interface Props {
  index: number
  title?: MaybeRefOrGetter<string | undefined>
  placeholderTitle?: string
  canRemove?: boolean
}

withDefaults(defineProps<Props>(), {
  title: '',
  placeholderTitle: 'New item',
  canRemove: true,
});

defineEmits<{
  remove: []
}>();
</script>

<template>
  <article class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
    <header class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span
          class="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700"
        >
          {{ index + 1 }}
        </span>
        <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {{ title || placeholderTitle }}
        </p>
      </div>
      <AppButton
        variant="danger-light"
        :disabled="!canRemove"
        :aria-label="`Remove item ${index + 1}`"
        @click="$emit('remove')"
      >
        <AppIcon name="bin" />
        Remove
      </AppButton>
    </header>
    <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <slot />
    </div>
  </article>
</template>
