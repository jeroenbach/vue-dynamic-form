<script lang="ts" setup>
export interface Step {
  title: string
  description?: string
}
interface Props {
  steps: Step[]
  currentStep: number
}
interface Emits {
  (e: 'goto', step: number): void
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <nav aria-label="Progress">
    <ol class="flex items-center">
      <li
        v-for="(step, i) in steps"
        :key="`${step.title}-${i}`"
        class="flex items-center"
        :class="{ 'flex-1': i < steps.length - 1 }"
      >
        <button
          type="button"
          :disabled="i > currentStep"
          :aria-label="`Step ${i + 1}: ${step.title}`"
          :aria-current="i === currentStep ? 'step' : undefined"
          class="flex flex-col items-center gap-1 focus:outline-none disabled:cursor-not-allowed cursor-pointer"
          @click="$emit('goto', i)"
        >
          <span
            class="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-all"
            :class="
              i < currentStep
                ? 'bg-emerald-500 text-white'
                : i === currentStep
                  ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            "
          >
            <svg
              v-if="i < currentStep"
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span
            class="hidden text-xs sm:block"
            :class="
              i < currentStep
                ? 'text-emerald-600'
                : i === currentStep
                  ? 'font-semibold text-slate-900 dark:text-slate-100'
                  : 'text-slate-400 dark:text-slate-500'
            "
          >
            {{ step.title }}
          </span>
        </button>
        <div
          v-if="i < steps.length - 1"
          class="mx-2 h-0.5 flex-1 transition-colors"
          :class="i < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"
        />
      </li>
    </ol>
  </nav>
</template>
