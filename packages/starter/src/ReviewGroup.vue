<script lang="ts" setup>
import AppButton from '@/AppButton.vue';
import StarterIcon from '@/StarterIcon.vue';

export interface Props {
  title: string
  rows: [label: string, value: string][]
  dataTestid?: string
}

defineProps<Props>();
defineEmits<{ edit: [] }>();
</script>

<template>
  <div :data-testid="dataTestid" class="sft-review-group">
    <header class="sft-review-header">
      <p class="sft-review-title">
        {{ title }}
      </p>
      <AppButton variant="danger-light" :dataTestid="dataTestid ? `${dataTestid}-edit-button` : undefined" @click="$emit('edit')">
        <StarterIcon name="pencil" :size="13" />
        Edit
      </AppButton>
    </header>
    <dl class="sft-review-list">
      <div v-for="[k, v] in rows" :key="k" class="sft-review-row">
        <dt class="sft-review-key">
          {{ k }}
        </dt>
        <dd class="sft-review-val">
          {{ v || '—' }}
        </dd>
      </div>
    </dl>
  </div>
</template>
