<script lang="ts" setup>
import StarterIcon from '@/StarterIcon.vue';

export interface Step {
  title: string
  description?: string
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

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <nav :data-testid="dataTestid" aria-label="Progress" class="sft-stepper">
    <ol>
      <li
        v-for="(step, i) in steps"
        :key="`${step.title}-${i}`"
        :class="{ grow: i < steps.length - 1 }"
      >
        <button
          type="button"
          class="sft-step"
          :class="{ 'is-done': i < currentStep, 'is-current': i === currentStep }"
          :data-testid="dataTestid ? `${dataTestid}-step-${i}` : undefined"
          :disabled="!allowForwardJump && i > currentStep"
          :aria-label="`Step ${i + 1}: ${step.title}`"
          :aria-current="i === currentStep ? 'step' : undefined"
          @click="$emit('goto', i)"
        >
          <span class="sft-step-dot">
            <StarterIcon v-if="i < currentStep" name="check" :size="14" :strokeWidth="3" />
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span class="sft-step-label">{{ step.title }}</span>
        </button>
        <span
          v-if="i < steps.length - 1"
          class="sft-step-connector"
          :class="{ 'is-done': i < currentStep }"
        />
      </li>
    </ol>
  </nav>
</template>
