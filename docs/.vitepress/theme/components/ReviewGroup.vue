<script lang="ts" setup>
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';

export interface Props {
  title: string
  rows: [label: string, value: string][]
}

defineProps<Props>();
defineEmits<{ edit: [] }>();
</script>

<template>
  <div class="mb-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
    <header class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2">
      <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ title }}</p>
      <AppButton variant="danger-light" @click="$emit('edit')">
        <AppIcon name="edit" :size="13" />
        Edit
      </AppButton>
    </header>
    <dl class="divide-y divide-slate-100 dark:divide-slate-700">
      <div v-for="[k, v] in rows" :key="k" class="flex items-start gap-4 px-4 py-2.5">
        <dt class="w-36 shrink-0 text-xs text-slate-500 dark:text-slate-400">{{ k }}</dt>
        <dd class="text-sm text-slate-800 dark:text-slate-200">{{ v || '—' }}</dd>
      </div>
    </dl>
  </div>
</template>
