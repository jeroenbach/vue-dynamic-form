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
  timelineTitle?: string
  timeline?: TimelineItem[]
  submittedJson?: string
  dataTestid?: string
}

defineProps<Props>();
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
        Reference
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
        <StarterIcon name="chevronRight" :size="14" />
        {{ showJson ? 'Hide' : 'View' }} submitted JSON
      </AppButton>
      <AppButton variant="primary" :dataTestid="dataTestid ? `${dataTestid}-reset-button` : undefined" @click="$emit('reset')">
        <StarterIcon name="refreshCw" />
        Start a new onboarding
      </AppButton>
    </div>
    <pre v-if="showJson" class="sft-col-span">{{ submittedJson }}</pre>
  </SectionCard>
</template>
