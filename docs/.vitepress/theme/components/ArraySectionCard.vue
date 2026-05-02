<script lang="ts" setup>
import type { Props as SectionCardProps } from './SectionCard.vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';
import SectionCard from './SectionCard.vue';

export interface Props extends /* @vue-ignore */ SectionCardProps {
  canAddItems?: boolean
  itemsCount?: number
  itemsName?: string
  itemsNamePlural?: string
  noItemsMessage?: string
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
      <div
        v-if="itemsCount === 0"
        class="md:col-span-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-8 text-center"
      >
        <AppIcon class="mx-auto mb-2 stroke-slate-400 dark:stroke-slate-500" name="grid" :size="32" />
        <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
          No {{ itemsNamePlural ?? 'items' }} added yet
        </p>
        <p v-if="noItemsMessage" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ noItemsMessage }}
        </p>
        <AppButton class="mt-4" variant="primary" @click="$emit('addItem')">
          <AppIcon name="plus" />
          Add a {{ itemsName ?? 'item' }}
        </AppButton>
      </div>
      <slot v-else />
    </template>
    <template #footer>
      <div class="mt-4">
        <AppButton :disabled="!canAddItems" @click="$emit('addItem')">
          <AppIcon name="plus" />
          <slot name="add-label">
            Add {{ itemsName ?? 'item' }}
          </slot>
        </AppButton>
      </div>
    </template>
  </SectionCard>
</template>
