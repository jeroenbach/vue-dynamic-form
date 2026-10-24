<script lang="ts" setup>
import { ref } from 'vue';
import AppButton from '@/AppButton.vue';
import SectionCard from '@/SectionCard.vue';
import StarterIcon from '@/StarterIcon.vue';

export interface TimelineItem {
  id: string
  label: string
  status: 'done' | 'pending'
}

export interface Props {
  title?: string
  referenceCode?: string
  referenceLabel?: string
  timelineTitle?: string
  timeline?: TimelineItem[]
  submittedJson?: string
  viewJsonText?: string
  hideJsonText?: string
  resetButtonText?: string
  dataTestid?: string
}

withDefaults(defineProps<Props>(), {
  referenceLabel: 'Reference',
  viewJsonText: 'View submitted JSON',
  hideJsonText: 'Hide submitted JSON',
  resetButtonText: 'Start a new onboarding',
});
defineEmits<{ reset: [] }>();

const showJson = ref(false);
</script>

<template>
  <SectionCard :dataTestid="dataTestid">
    <div class="sft-success-hero">
      <div class="sft-success-badge">
        <StarterIcon name="check" :size="32" />
      </div>
      <h2 class="sft-success-title">
        {{ title }}
      </h2>
      <p class="sft-success-ref">
        {{ referenceLabel }}
        <code>{{ referenceCode }}</code>
      </p>
    </div>

    <div v-if="timeline?.length" class="sft-timeline">
      <p class="sft-timeline-title">
        {{ timelineTitle }}
      </p>
      <ul>
        <li v-for="item in timeline" :key="item.id" :class="{ 'is-pending': item.status === 'pending' }">
          <span class="sft-timeline-dot" :class="item.status === 'done' ? 'is-done' : 'is-pending'">
            <StarterIcon v-if="item.status === 'done'" name="checkCircle" :size="20" />
            <StarterIcon v-else name="loader" :size="18" class="sft-spin" />
          </span>
          <span>{{ item.label }}</span>
        </li>
      </ul>
    </div>

    <div class="sft-success-actions">
      <AppButton variant="ghost" :dataTestid="dataTestid ? `${dataTestid}-toggle-json-button` : undefined" @click="showJson = !showJson">
        <span class="sft-json-chevron" :class="{ 'is-open': showJson }">
          <StarterIcon name="chevronRight" :size="14" />
        </span>
        {{ showJson ? hideJsonText : viewJsonText }}
      </AppButton>
      <AppButton variant="primary" :dataTestid="dataTestid ? `${dataTestid}-reset-button` : undefined" @click="$emit('reset')">
        <StarterIcon name="refreshCw" />
        {{ resetButtonText }}
      </AppButton>
    </div>
    <Transition name="sft-reveal">
      <pre v-if="showJson" class="sft-col-span sft-json">{{ submittedJson }}</pre>
    </Transition>
  </SectionCard>
</template>
