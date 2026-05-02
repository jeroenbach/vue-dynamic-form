<script lang="ts" setup>
export interface Props {
  title?: string
  description?: string
  selected?: boolean
}

defineProps<Props>();
defineEmits<{ select: [] }>();
</script>

<template>
  <button
    type="button"
    role="radio"
    :aria-checked="selected"
    class="rounded-xl border bg-white dark:bg-slate-900 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
    :class="selected
      ? 'border-indigo-600 bg-gradient-to-b from-indigo-50 dark:from-indigo-950 to-white dark:to-slate-900 shadow-sm ring-1 ring-indigo-600'
      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'"
    @click="$emit('select')"
  >
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition-colors"
        :class="selected ? 'border-indigo-600' : 'border-slate-300 dark:border-slate-600'"
      >
        <span
          class="h-2 w-2 rounded-full bg-indigo-600 transition-transform"
          :class="selected ? 'scale-100' : 'scale-0'"
        />
      </span>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span v-if="$slots.icon" class="text-indigo-700"><slot name="icon" /></span>
          <p v-if="title" class="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {{ title }}
          </p>
        </div>
        <p v-if="description" class="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {{ description }}
        </p>
      </div>
    </div>
  </button>
</template>
