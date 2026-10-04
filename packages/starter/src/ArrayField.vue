<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import AppButton from '@/AppButton.vue';
import ErrorMessage from '@/ErrorMessage.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  itemsLength?: number
  description?: string
  disabled?: boolean
  canAddItems?: boolean
  errorMessage?: string
  dataTestid?: string
}

defineProps<Props>();

defineEmits<{
  add: []
}>();
</script>

<template>
  <section
    :data-testid="dataTestid"
    class="sft-section"
    :class="{ 'is-disabled': disabled }"
  >
    <header class="sft-section-header">
      <div>
        <h2 class="sft-section-title">
          {{ label }}
        </h2>
        <p class="sft-section-desc">
          {{ description }}
        </p>
      </div>
      <span :data-testid="dataTestid ? `${dataTestid}-count` : undefined" class="sft-pill">
        {{ itemsLength }} {{ itemsLength === 1 ? 'item' : 'items' }}
      </span>
    </header>

    <div class="sft-grid">
      <slot />
    </div>
    <div class="sft-array-footer">
      <AppButton
        v-if="canAddItems"
        label="Add another"
        :dataTestid="dataTestid ? `${dataTestid}-add-button` : undefined"
        @click="$emit('add')"
      />
    </div>
    <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </section>
</template>
