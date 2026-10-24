<script lang="ts" setup>
export interface Step {
  title: string
  description?: string
  /** When true, the step's fields have validation errors and the step renders in red. */
  hasError?: boolean
}
interface Props {
  steps: Step[]
  currentStep: number
  /** When true, the wizard is non-linear: every step is clickable, not just the current and visited ones. */
  allowForwardJump?: boolean
  dataTestid?: string
}
interface Emits {
  (e: 'goto', step: number): void
}

const props = defineProps<Props>();
defineEmits<Emits>();

type StepState = 'error' | 'errorCurrent' | 'completed' | 'current' | 'upcoming';

function stepState(step: Step, i: number): StepState {
  if (step.hasError)
    return i === props.currentStep ? 'errorCurrent' : 'error';
  if (i < props.currentStep)
    return 'completed';
  if (i === props.currentStep)
    return 'current';
  return 'upcoming';
}

const circleClasses: Record<StepState, string> = {
  error: 'bg-red-500 text-white',
  errorCurrent: 'bg-red-500 text-white ring-4 ring-red-100 dark:ring-red-900',
  completed: 'bg-emerald-500 text-white',
  current: 'bg-sky-600 text-white ring-4 ring-sky-100',
  upcoming: 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
};

const titleClasses: Record<StepState, string> = {
  error: 'text-red-600 dark:text-red-400',
  errorCurrent: 'font-semibold text-red-600 dark:text-red-400',
  completed: 'text-emerald-600',
  current: 'font-semibold text-slate-900 dark:text-slate-100',
  upcoming: 'text-slate-400 dark:text-slate-500',
};
</script>

<template>
  <nav :data-testid="dataTestid" aria-label="Progress">
    <ol class="flex items-center">
      <li
        v-for="(step, i) in steps"
        :key="`${step.title}-${i}`"
        class="flex items-center"
        :class="{ 'flex-1': i < steps.length - 1 }"
      >
        <button
          type="button"
          :data-testid="dataTestid ? `${dataTestid}-step-${i}` : undefined"
          :disabled="!allowForwardJump && i > currentStep"
          :aria-label="`Step ${i + 1}: ${step.title}${step.hasError ? ' (contains errors)' : ''}`"
          :aria-current="i === currentStep ? 'step' : undefined"
          :aria-invalid="step.hasError || undefined"
          class="flex flex-col items-center gap-1 focus:outline-none disabled:cursor-not-allowed cursor-pointer"
          @click="$emit('goto', i)"
        >
          <span
            class="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-all"
            :class="circleClasses[stepState(step, i)]"
          >
            <span v-if="step.hasError" aria-hidden="true">!</span>
            <svg
              v-else-if="i < currentStep"
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
            :class="titleClasses[stepState(step, i)]"
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
