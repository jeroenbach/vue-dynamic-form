<script lang="ts" setup>
import type { Props as SectionCardProps } from '@/SectionCard.vue';
import AppButton from '@/AppButton.vue';
import SectionCard from '@/SectionCard.vue';
import StarterIcon from '@/StarterIcon.vue';

export interface Props extends /* @vue-ignore */ SectionCardProps {
  canAddItems?: boolean
  itemsCount?: number
  itemsName?: string
  itemsNamePlural?: string
  noItemsMessage?: string
  dataTestid?: string
}

defineProps<Props>();
defineEmits<{ addItem: [] }>();
</script>

<template>
  <SectionCard
    v-bind="$props"
    :tag="`${itemsCount} ${itemsCount === 1 ? (itemsName ?? 'item') : (itemsNamePlural ?? 'items')}`"
  >
    <template #default>
      <div v-if="itemsCount === 0" class="sft-col-span sft-empty">
        <StarterIcon class="sft-empty-icon" name="grid" :size="32" />
        <p class="sft-empty-title">
          No {{ itemsNamePlural ?? 'items' }} added yet
        </p>
        <p v-if="noItemsMessage" class="sft-empty-hint">
          {{ noItemsMessage }}
        </p>
        <AppButton variant="primary" :dataTestid="dataTestid ? `${dataTestid}-add-button` : undefined" @click="$emit('addItem')">
          <StarterIcon name="plus" />
          Add a {{ itemsName ?? 'item' }}
        </AppButton>
      </div>
      <slot v-else />
    </template>
    <template #footer>
      <div class="sft-array-footer">
        <AppButton :disabled="!canAddItems" :dataTestid="dataTestid ? `${dataTestid}-add-button` : undefined" @click="$emit('addItem')">
          <StarterIcon name="plus" />
          <slot name="add-label">
            Add {{ itemsName ?? 'item' }}
          </slot>
        </AppButton>
      </div>
    </template>
  </SectionCard>
</template>
