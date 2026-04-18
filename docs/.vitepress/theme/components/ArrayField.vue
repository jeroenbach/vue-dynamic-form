<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import AppButton from './AppButton.vue';
import ErrorMessage from './ErrorMessage.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  required?: boolean
  disabled?: boolean
  canAddItems?: boolean
  errorMessage?: string
  dataTestid?: string
}

defineEmits<{
  add: []
}>();

defineProps<Props>();
</script>

<template>
  <section class="md:col-span-2">
    <div
      class="mb-3 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-start md:justify-between"
      :class="{ 'opacity-60': disabled }"
    >
      <div class="space-y-1">
        <span class="block text-sm font-semibold text-slate-900">
          {{ label }}
          <span v-if="required" class="text-red-500">*</span>
        </span>
        <p v-if="description" class="text-sm text-slate-600">
          {{ description }}
        </p>
      </div>
      <AppButton
        v-if="canAddItems"
        label="Add another"
        @click="$emit('add')"
      />
    </div>
    <div class="grid grid-cols-1 gap-4">
      <slot />
    </div>
    <ErrorMessage :error-message="errorMessage" :data-testid="dataTestid" />
  </section>
</template>
