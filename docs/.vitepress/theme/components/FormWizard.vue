<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { Step } from './Stepper.vue';
import { computed } from 'vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';
import Stepper from './Stepper.vue';

interface Props {
  title?: MaybeRefOrGetter<string | undefined>
  subTitle?: string
  steps?: Step[]
  currentStepIndex: number
  isFirst: boolean
  isLast: boolean
  isValidating: boolean
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
    <header class="mb-6 flex items-center justify-between">
      <div>
        <p v-if="title" class="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {{ title }}
        </p>
        <h1 v-if="subTitle" class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {{ subTitle }}
        </h1>
      </div>
    </header>

    <div class="mb-8">
      <Stepper :steps="steps ?? []" :current-step="currentStepIndex" @goto="gotoStep" />
    </div>

    <!--
      Pages stay mounted at all times; the engine's -wizard-page wrapper (rendered inside this
      slot) toggles their visibility with v-show. Never wrap this <main> in a v-if per page, or
      navigating away clears the page's values and deregisters its fields.
    -->
    <main>
      <slot />
    </main>

    <footer class="mt-8 flex items-center justify-between">
      <AppButton
        type="button"
        :dataTestid="dataTestid ? `${dataTestid}-back-button` : undefined"
        class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
        :class="{ invisible: isFirst }"
        @click="prev"
      >
        <AppIcon name="chevronLeft" />
        {{ prevButton }}
      </AppButton>

      <p v-if="helperText" class="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
        {{ helperText }}
      </p>

      <AppButton
        v-if="isLast"
        variant="primary"
        type="submit"
        :dataTestid="dataTestid ? `${dataTestid}-submit-button` : undefined"
      >
        {{ submitButton }}
        <AppIcon name="check" />
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
        <AppIcon name="chevronRight" />
      </AppButton>
    </footer>
  </div>
</template>
