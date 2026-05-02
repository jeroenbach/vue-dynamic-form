<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import type { LoadingResolve } from '../utils/loadingResolve';
import type { Step } from './Stepper.vue';
import { computed, ref } from 'vue';
import { createLoadingResolve } from '../utils/loadingResolve';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';
import Stepper from './Stepper.vue';

interface Props {
  title?: MaybeRefOrGetter<string | undefined>
  subTitle?: string
  steps?: Step[]
  nextButton?: string
  prevButton?: string
  submitButton?: string
}
interface Emits {
  (e: 'validatePage', pageIndex: number, loadingResolve: LoadingResolve): void
  (e: 'submit', loadingResolve: LoadingResolve): void
}

const { steps = [] } = defineProps<Props>();
const emits = defineEmits<Emits>();
const currentStepIndex = ref(0);
const currentStep = computed(() => steps?.[currentStepIndex.value ?? 0]);
const isLast = computed(() => currentStepIndex.value === steps.length - 1);
const isFirst = computed(() => currentStepIndex.value === 0);
const helperText = computed(() => [`Step ${currentStepIndex.value + 1} of ${steps.length}`, currentStep.value?.description || currentStep.value?.title].join(' · '));

function gotoStep(_index: number) {
  if (_index >= 0 && _index <= steps.length - 1 && _index <= currentStepIndex.value) {
    currentStepIndex.value = _index;
  }
}
async function submit() {
  const resolve = createLoadingResolve();
  emits('submit', resolve);

  if (!(await resolve.promise))
    return;

  // Todo, show a success page
}
async function next() {
  const resolve = createLoadingResolve();
  emits('validatePage', currentStepIndex.value, resolve);

  if (!(await resolve.promise))
    return;

  if (currentStepIndex.value < steps.length - 1)
    currentStepIndex.value++;
}
function prev() {
  if (currentStepIndex.value > 0)
    currentStepIndex.value--;
}
</script>

<template>
  <div>
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
      <Stepper :steps="steps" :current-step="currentStepIndex" @goto="gotoStep" />
    </div>

    <main>
      <slot :currentStepIndex :gotoStep />
    </main>

    <footer class="mt-8 flex items-center justify-between">
      <AppButton
        type="button"
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
        @click="submit"
      >
        {{ submitButton }}
        <AppIcon name="check" />
      </AppButton>
      <AppButton
        v-else
        type="button"
        variant="primary"
        @click="next"
      >
        {{ nextButton }}
        <AppIcon name="chevronRight" />
      </AppButton>
    </footer>
  </div>
</template>
