<script lang="ts" setup>
import { useId } from 'vue';
import StarterIcon from '@/StarterIcon.vue';

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
  ariaLabel?: string
  /** Aria label per step button; `{number}` and `{title}` are replaced by the step number and title. */
  stepAriaLabel?: string
  /** Appended to a step's aria-label when it has errors. */
  stepErrorAriaLabelSuffix?: string
  dataTestid?: string
  /**
   * Prefix for each step label's id, so a caller (the wizard page container)
   * can point its own `aria-labelledby` at the exact same id. Generated locally
   * when not given, so the label always has an id to be referenced by.
   */
  stepLabelIdPrefix?: string
}

interface Emits {
  (e: 'goto', step: number): void
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Progress',
  stepAriaLabel: 'Step {number}: {title}',
  stepErrorAriaLabelSuffix: ' (contains errors)',
});
defineEmits<Emits>();

function stepLabel(index: number): string {
  const label = props.stepAriaLabel
    .replace('{number}', String(index + 1))
    .replace('{title}', props.steps[index]?.title ?? '');
  return props.steps[index]?.hasError ? `${label}${props.stepErrorAriaLabelSuffix}` : label;
}

// Independent of dataTestid, which is a test-selector convention that a
// consumer is free to leave unset; the label's id must exist regardless so
// aria-labelledby always has something real to point at.
const fallbackIdPrefix = useId();

/**
 * Id for a step's title, so the wizard page container can point its
 * aria-labelledby at the same text the stepper already shows for that step.
 */
function stepLabelId(index: number): string {
  return `${props.stepLabelIdPrefix ?? fallbackIdPrefix}-step-label-${index}`;
}
</script>

<template>
  <nav :data-testid="dataTestid" :aria-label="ariaLabel" class="sft-stepper">
    <ol>
      <li
        v-for="(step, i) in steps"
        :key="`${step.title}-${i}`"
        :class="{ grow: i < steps.length - 1 }"
      >
        <button
          type="button"
          class="sft-step"
          :class="{ 'is-done': i < currentStep, 'is-current': i === currentStep, 'is-error': step.hasError }"
          :data-testid="dataTestid ? `${dataTestid}-step-${i}` : undefined"
          :disabled="!allowForwardJump && i > currentStep"
          :aria-label="stepLabel(i)"
          :aria-current="i === currentStep ? 'step' : undefined"
          :aria-invalid="step.hasError || undefined"
          @click="$emit('goto', i)"
        >
          <span class="sft-step-dot">
            <span v-if="step.hasError" aria-hidden="true">!</span>
            <StarterIcon v-else-if="i < currentStep" name="check" :size="14" :strokeWidth="3" />
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span :id="stepLabelId(i)" class="sft-step-label">{{ step.title }}</span>
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
