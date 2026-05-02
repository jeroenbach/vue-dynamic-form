<script lang="ts" setup>
import { ref } from 'vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';
import SectionCard from './SectionCard.vue';

export interface TimelineItem {
  id: string
  label: string
  status: 'done' | 'pending'
}

export interface Props {
  title?: string
  referenceCode?: string
  timelineTitle?: string
  timeline?: TimelineItem[]
  submittedJson?: string
}

defineProps<Props>();
defineEmits<{ reset: [] }>();

const showJson = ref(false);
</script>

<template>
  <SectionCard>
    <div class="md:col-span-2 flex flex-col items-center text-center">
      <div class="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
        <AppIcon name="check" :size="32" />
      </div>
      <h2 class="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
        {{ title }}
      </h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Reference
        <span class="font-mono font-medium text-slate-800 dark:text-slate-200">{{ referenceCode }}</span>
      </p>
    </div>

    <div class="md:col-span-2 mt-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5">
      <p class="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {{ timelineTitle }}
      </p>
      <ul class="space-y-2.5">
        <li
          v-for="item in timeline"
          :key="item.id"
          class="flex items-center gap-3 text-sm transition-colors"
          :class="item.status === 'done' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'"
        >
          <span class="grid h-5 w-5 shrink-0 place-items-center">
            <AppIcon
              v-if="item.status === 'done'"
              name="checkCircle"
              :size="20"
              class="stroke-emerald-500"
            />
            <AppIcon
              v-else
              name="spinner"
              :size="18"
              class="animate-spin stroke-slate-400 dark:stroke-slate-500"
            />
          </span>
          <span>{{ item.label }}</span>
        </li>
      </ul>
    </div>

    <div class="md:col-span-2 mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <AppButton variant="ghost" @click="showJson = !showJson">
        <AppIcon name="chevronRight" :size="14" class="transition-transform" :class="showJson ? 'rotate-90' : ''" />
        {{ showJson ? 'Hide' : 'View' }} submitted JSON
      </AppButton>
      <AppButton variant="primary" @click="$emit('reset')">
        <AppIcon name="refresh" />
        Start a new onboarding
      </AppButton>
    </div>
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <pre
        v-if="showJson"
        class="md:col-span-2 mt-4 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100"
      >{{ submittedJson }}</pre>
    </Transition>
  </SectionCard>
</template>
