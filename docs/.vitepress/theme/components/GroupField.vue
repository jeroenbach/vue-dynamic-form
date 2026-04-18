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
  canRemoveItems?: boolean
  errorMessage?: string
  dataTestid?: string
}

defineEmits<{
  add: []
  remove: []
}>();

defineProps<Props>();
</script>

<template>
  <section
    class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:col-span-2"
    :class="{ 'opacity-60': disabled }"
  >
    <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div class="space-y-1">
        <span class="block text-sm font-semibold text-slate-900">
          {{ label }}
          <span v-if="required" class="text-red-500">*</span>
        </span>
        <p v-if="description" class="text-sm text-slate-600">
          {{ description }}
        </p>
      </div>
      <div class="flex gap-2">
        <AppButton
          v-if="canAddItems"
          label="Add"
          @click="$emit('add')"
        />
        <AppButton
          v-if="canRemoveItems"
          label="Remove"
          variant="danger"
          @click="$emit('remove')"
        />
      </div>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <slot />
    </div>
    <ErrorMessage :error-message="errorMessage" :data-testid="dataTestid" />
  </section>
</template>
