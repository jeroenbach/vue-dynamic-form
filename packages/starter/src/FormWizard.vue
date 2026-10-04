<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { Step } from '@/Stepper.vue';
import { computed } from 'vue';
import AppButton from '@/AppButton.vue';
import StarterIcon from '@/StarterIcon.vue';
import Stepper from '@/Stepper.vue';

interface Props {
  title?: MaybeRefOrGetter<string | undefined>
  subTitle?: string
  steps?: Step[]
  currentStepIndex: number
  isFirst: boolean
  isLast: boolean
  isValidating: boolean
  allowForwardJump?: boolean
  next: () => Promise<void>
  prev: () => void
  gotoStep: (index: number) => void
  nextButton?: string
  prevButton?: string
  submitButton?: string
  dataTestid?: string
}

const props = defineProps<Props>();
const currentStep = computed(() => props.steps?.[props.currentStepIndex]);
const helperText = computed(() =>
  [`Step ${props.currentStepIndex + 1} of ${props.steps?.length ?? 0}`, currentStep.value?.description || currentStep.value?.title].join(' · '));
</script>

<template>
  <div :data-testid="dataTestid">
    <header v-if="title || subTitle" class="sft-wizard-head">
      <p v-if="title" class="sft-wizard-eyebrow">
        {{ title }}
      </p>
      <h1 v-if="subTitle" class="sft-wizard-title">
        {{ subTitle }}
      </h1>
    </header>

    <Stepper :steps="steps ?? []" :currentStep="currentStepIndex" :allowForwardJump :dataTestid @goto="gotoStep" />

    <!--
      Pages stay mounted at all times; the engine's -wizard-page wrapper (rendered inside this
      slot) toggles their visibility with v-show. Never wrap this <main> in a v-if per page, or
      navigating away deregisters its fields from vee-validate (so submit sends them unvalidated)
      and clears their values unless keepValuesOnUnmount is set; the deregistration happens either
      way, so v-show stays required for any page with fields.
    -->
    <main>
      <slot />
    </main>

    <footer class="sft-wizard-footer">
      <AppButton
        type="button"
        :class="{ 'is-hidden': isFirst }"
        :dataTestid="dataTestid ? `${dataTestid}-back-button` : undefined"
        @click="prev"
      >
        <StarterIcon name="chevronLeft" />
        {{ prevButton }}
      </AppButton>

      <p v-if="helperText" class="sft-wizard-helper">
        {{ helperText }}
      </p>

      <AppButton
        v-if="isLast"
        variant="primary"
        type="submit"
        :dataTestid="dataTestid ? `${dataTestid}-submit-button` : undefined"
      >
        {{ submitButton }}
        <StarterIcon name="check" />
      </AppButton>
      <AppButton
        v-else
        type="button"
        variant="primary"
        :disabled="isValidating"
        :dataTestid="dataTestid ? `${dataTestid}-next-button` : undefined"
        @click="next"
      >
        {{ nextButton }}
        <StarterIcon name="chevronRight" />
      </AppButton>
    </footer>
  </div>
</template>
