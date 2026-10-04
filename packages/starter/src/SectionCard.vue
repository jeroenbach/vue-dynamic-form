<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import ErrorMessage from '@/ErrorMessage.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  tag?: string
  errorMessage?: string
  dataTestid?: string
}

defineProps<Props>();
</script>

<template>
  <section :data-testid="dataTestid" class="sft-section">
    <header class="sft-section-header">
      <div>
        <h2 v-if="label" class="sft-section-title">
          {{ label }}
        </h2>
        <p v-if="description" class="sft-section-desc">
          {{ description }}
        </p>
        <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
      </div>
      <span v-if="tag" class="sft-pill">
        {{ tag }}
      </span>
    </header>
    <div class="sft-grid">
      <slot />
    </div>
    <slot name="footer" />
  </section>
</template>
